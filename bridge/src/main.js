import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const state = {
  selectionPath: "",
  selectionFilename: "",
  basenames: [],
  sourceFolder: "",
  outputFolder: "",
  outputFolderCustom: false,
  fileType: "raw",
  lastResult: null,
  apiContext: null,
  lastErrorMessage: "",
};

const els = {
  formView: document.getElementById("form-view"),
  progressView: document.getElementById("progress-view"),
  resultsView: document.getElementById("results-view"),
  dropZone: document.getElementById("drop-zone"),
  selectionLoading: document.getElementById("selection-loading"),
  selectionApiLoaded: document.getElementById("selection-api-loaded"),
  selectionProjectName: document.getElementById("selection-project-name"),
  selectionClientName: document.getElementById("selection-client-name"),
  selectionApiCount: document.getElementById("selection-api-count"),
  selectionApiPreview: document.getElementById("selection-api-preview"),
  clearApiSelection: document.getElementById("clear-api-selection"),
  selectionError: document.getElementById("selection-error"),
  selectionErrorMessage: document.getElementById("selection-error-message"),
  retryApiFetch: document.getElementById("retry-api-fetch"),
  loadTxtManually: document.getElementById("load-txt-manually"),
  selectionLoaded: document.getElementById("selection-loaded"),
  selectionFilename: document.getElementById("selection-filename"),
  selectionCount: document.getElementById("selection-count"),
  selectionPreview: document.getElementById("selection-preview"),
  clearSelection: document.getElementById("clear-selection"),
  sourceFolder: document.getElementById("source-folder"),
  browseSource: document.getElementById("browse-source"),
  outputFolder: document.getElementById("output-folder"),
  outputHelper: document.getElementById("output-helper"),
  browseOutput: document.getElementById("browse-output"),
  copyBtn: document.getElementById("copy-btn"),
  progressFill: document.getElementById("progress-fill"),
  progressStatus: document.getElementById("progress-status"),
  resultsCopied: document.getElementById("results-copied"),
  resultsMissingRow: document.getElementById("results-missing-row"),
  resultsMissing: document.getElementById("results-missing"),
  resultsPath: document.getElementById("results-path"),
  toggleMissing: document.getElementById("toggle-missing"),
  missingList: document.getElementById("missing-list"),
  openOutput: document.getElementById("open-output"),
  startOver: document.getElementById("start-over"),
  toggles: document.querySelectorAll(".toggle"),
};

const step1Panels = [
  els.dropZone,
  els.selectionLoading,
  els.selectionApiLoaded,
  els.selectionError,
  els.selectionLoaded,
];

function showError(message) {
  const existing = document.querySelector(".error-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "error-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

function setView(view) {
  els.formView.classList.toggle("hidden", view !== "form");
  els.progressView.classList.toggle("hidden", view !== "progress");
  els.resultsView.classList.toggle("hidden", view !== "results");
}

function setStep1State(active) {
  for (const panel of step1Panels) {
    panel.classList.toggle("hidden", panel !== active);
  }
}

function updateCopyButton() {
  els.copyBtn.disabled = !(state.basenames.length > 0 && state.sourceFolder);
}

function renderSelectionPreview() {
  const preview = state.basenames.slice(0, 5);
  els.selectionPreview.innerHTML = "";
  for (const name of preview) {
    const li = document.createElement("li");
    li.textContent = name;
    els.selectionPreview.appendChild(li);
  }
  if (state.basenames.length > 5) {
    const li = document.createElement("li");
    li.textContent = "…";
    els.selectionPreview.appendChild(li);
  }
}

function renderApiPreview(filenames) {
  els.selectionApiPreview.innerHTML = "";
  const preview = filenames.slice(0, 3);
  for (const name of preview) {
    const li = document.createElement("li");
    li.textContent = name;
    els.selectionApiPreview.appendChild(li);
  }
  const remaining = filenames.length - preview.length;
  if (remaining > 0) {
    const li = document.createElement("li");
    li.textContent = `… and ${remaining} more`;
    els.selectionApiPreview.appendChild(li);
  }
}

function applyProjectSelection(selection) {
  state.basenames = selection.filenames ?? [];
  state.selectionPath = "";
  state.selectionFilename = selection.project_name ?? "Aphogato project";
  state.apiContext = null;

  els.selectionProjectName.textContent = selection.project_name ?? "Untitled project";
  els.selectionClientName.textContent = selection.client_name || "Client";
  els.selectionApiCount.textContent = `${selection.selected_count ?? state.basenames.length} photo${
    (selection.selected_count ?? state.basenames.length) === 1 ? "" : "s"
  } selected`;
  renderApiPreview(state.basenames);
  setStep1State(els.selectionApiLoaded);
  updateCopyButton();
}

function resetStep1ToDefault() {
  state.selectionPath = "";
  state.selectionFilename = "";
  state.basenames = [];
  state.apiContext = null;
  state.lastErrorMessage = "";
  setStep1State(els.dropZone);
  updateCopyButton();
}

async function loadSelectionFile(path) {
  const basenames = await invoke("parse_txt_file", { path });
  state.selectionPath = path;
  state.selectionFilename = path.split(/[/\\]/).pop() ?? path;
  state.basenames = basenames;
  state.apiContext = null;

  els.selectionFilename.textContent = state.selectionFilename;
  els.selectionCount.textContent = `${state.basenames.length} photo${
    state.basenames.length === 1 ? "" : "s"
  } in selection`;
  renderSelectionPreview();
  setStep1State(els.selectionLoaded);
  updateCopyButton();
}

function clearSelection() {
  resetStep1ToDefault();
}

async function pickTxtFile() {
  const selected = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "Text", extensions: ["txt"] }],
  });
  if (typeof selected === "string") {
    await loadSelectionFile(selected);
  }
}

function parseDeepLink(url) {
  const normalized = url.replace(/^aphogato:/i, "http:");
  const parsed = new URL(normalized);
  return {
    projectId: parsed.searchParams.get("project_id"),
    token: parsed.searchParams.get("token"),
    host: parsed.searchParams.get("host"),
  };
}

async function fetchProjectFromAPI(host, projectId, token) {
  if (!host || !projectId || !token) {
    showApiError("Invalid deep link — missing project_id, token, or host.");
    return;
  }

  state.apiContext = { host, projectId, token };
  setStep1State(els.selectionLoading);

  try {
    const selection = await invoke("fetch_project_selection", {
      host,
      projectId,
      token,
    });
    applyProjectSelection(selection);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    showApiError(message);
  }
}

function showApiError(message) {
  state.lastErrorMessage = message;
  els.selectionErrorMessage.textContent = message;
  setStep1State(els.selectionError);
  updateCopyButton();
}

function handleDeepLinkUrl(url) {
  const { projectId, token, host } = parseDeepLink(url);
  fetchProjectFromAPI(host, projectId, token).catch((err) =>
    showApiError(err instanceof Error ? err.message : String(err))
  );
}

async function setupDeepLinks() {
  const startUrls = await getCurrent();
  if (startUrls?.length) {
    handleDeepLinkUrl(startUrls[startUrls.length - 1]);
  }

  await onOpenUrl((urls) => {
    if (urls?.length) {
      handleDeepLinkUrl(urls[urls.length - 1]);
    }
  });

  await listen("deep-link-received", (event) => {
    if (typeof event.payload === "string") {
      handleDeepLinkUrl(event.payload);
    }
  });
}

async function setSourceFolder(folder) {
  state.sourceFolder = folder;
  els.sourceFolder.value = folder;

  if (!state.outputFolderCustom) {
    const defaultOutput = await invoke("get_default_output_folder", {
      sourceFolder: folder,
    });
    els.outputFolder.value = "";
    els.outputHelper.textContent = `Default: ${defaultOutput}`;
  }

  updateCopyButton();
}

async function browseSourceFolder() {
  const selected = await open({ directory: true, multiple: false });
  if (typeof selected === "string") {
    await setSourceFolder(selected);
  }
}

async function browseOutputFolder() {
  const selected = await open({ directory: true, multiple: false });
  if (typeof selected === "string") {
    state.outputFolder = selected;
    state.outputFolderCustom = true;
    els.outputFolder.value = selected;
    els.outputHelper.textContent = "Using custom output folder";
  }
}

async function resolveOutputFolder() {
  if (state.outputFolderCustom && state.outputFolder) {
    return state.outputFolder;
  }
  if (!state.sourceFolder) {
    throw new Error("Source folder is required");
  }
  return invoke("get_default_output_folder", {
    sourceFolder: state.sourceFolder,
  });
}

function setFileType(type) {
  state.fileType = type;
  els.toggles.forEach((btn) => {
    const active = btn.dataset.type === type;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

async function runCopy() {
  setView("progress");
  els.progressFill.style.width = "0%";
  els.progressStatus.textContent = "Preparing…";

  const unlisten = await listen("copy-progress", (event) => {
    const { current, total, filename } = event.payload;
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    els.progressFill.style.width = `${pct}%`;
    els.progressStatus.textContent = `Copying ${filename}… (${current} of ${total})`;
  });

  try {
    const outputFolder = await resolveOutputFolder();
    const result = await invoke("copy_selected_files", {
      sourceFolder: state.sourceFolder,
      selectedBasenames: state.basenames,
      fileType: state.fileType,
      outputFolder,
    });

    state.lastResult = result;
    showResults(result);
  } catch (err) {
    setView("form");
    showError(err instanceof Error ? err.message : String(err));
  } finally {
    unlisten();
  }
}

function showResults(result) {
  setView("results");

  const copiedCount = result.copied.length;
  els.resultsCopied.textContent = `${copiedCount} photo${
    copiedCount === 1 ? "" : "s"
  } copied`;

  const missingCount = result.not_found.length;
  if (missingCount > 0) {
    els.resultsMissingRow.classList.remove("hidden");
    els.resultsMissing.textContent = `${missingCount} photo${
      missingCount === 1 ? "" : "s"
    } not found`;
    els.toggleMissing.classList.remove("hidden");
    els.missingList.innerHTML = "";
    for (const name of result.not_found) {
      const li = document.createElement("li");
      li.textContent = name;
      els.missingList.appendChild(li);
    }
  } else {
    els.resultsMissingRow.classList.add("hidden");
    els.toggleMissing.classList.add("hidden");
    els.missingList.classList.add("hidden");
  }

  els.resultsPath.textContent = result.output_folder;

  setTimeout(() => {
    invoke("open_folder", { path: result.output_folder }).catch((err) =>
      console.warn("Could not auto-open output folder:", err)
    );
  }, 500);
}

function resetForm() {
  clearSelection();
  state.sourceFolder = "";
  state.outputFolder = "";
  state.outputFolderCustom = false;
  state.lastResult = null;
  els.sourceFolder.value = "";
  els.outputFolder.value = "";
  els.outputHelper.textContent = "Default: [source folder]/to-edit/";
  setFileType("raw");
  setView("form");
  updateCopyButton();
}

function setupDragDrop() {
  const webview = getCurrentWebviewWindow();

  webview.onDragDropEvent((event) => {
    const payload = event.payload;
    if (payload.type === "over") {
      els.dropZone.classList.add("drag-over");
    } else if (payload.type === "leave") {
      els.dropZone.classList.remove("drag-over");
    } else if (payload.type === "drop") {
      els.dropZone.classList.remove("drag-over");
      const txtPath = payload.paths.find((p) => p.toLowerCase().endsWith(".txt"));
      if (!txtPath) {
        showError("Please drop a .txt selection file");
        return;
      }
      loadSelectionFile(txtPath).catch((err) =>
        showError(err instanceof Error ? err.message : String(err))
      );
    }
  });
}

function bindEvents() {
  els.dropZone.addEventListener("click", () => {
    pickTxtFile().catch((err) =>
      showError(err instanceof Error ? err.message : String(err))
    );
  });

  els.dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pickTxtFile().catch((err) =>
        showError(err instanceof Error ? err.message : String(err))
      );
    }
  });

  els.clearSelection.addEventListener("click", clearSelection);
  els.clearApiSelection.addEventListener("click", clearSelection);
  els.loadTxtManually.addEventListener("click", clearSelection);
  els.retryApiFetch.addEventListener("click", () => {
    if (!state.apiContext) {
      resetStep1ToDefault();
      return;
    }
    fetchProjectFromAPI(
      state.apiContext.host,
      state.apiContext.projectId,
      state.apiContext.token
    ).catch((err) =>
      showApiError(err instanceof Error ? err.message : String(err))
    );
  });

  els.browseSource.addEventListener("click", () => {
    browseSourceFolder().catch((err) =>
      showError(err instanceof Error ? err.message : String(err))
    );
  });
  els.browseOutput.addEventListener("click", () => {
    browseOutputFolder().catch((err) =>
      showError(err instanceof Error ? err.message : String(err))
    );
  });

  els.toggles.forEach((btn) => {
    btn.addEventListener("click", () => setFileType(btn.dataset.type));
  });

  els.copyBtn.addEventListener("click", () => {
    runCopy().catch((err) =>
      showError(err instanceof Error ? err.message : String(err))
    );
  });

  els.toggleMissing.addEventListener("click", () => {
    const hidden = els.missingList.classList.toggle("hidden");
    els.toggleMissing.textContent = hidden
      ? "▸ Show missing files"
      : "▾ Hide missing files";
  });

  els.openOutput.addEventListener("click", () => {
    if (!state.lastResult?.output_folder) return;
    invoke("open_folder", { path: state.lastResult.output_folder }).catch((err) =>
      showError(err instanceof Error ? err.message : String(err))
    );
  });

  els.startOver.addEventListener("click", resetForm);
}

try {
  setupDragDrop();
} catch (err) {
  console.warn("Drag and drop unavailable:", err);
}

bindEvents();
updateCopyButton();

setupDeepLinks().catch((err) => {
  console.warn("Deep link setup unavailable:", err);
});
