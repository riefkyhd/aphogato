import { NewProjectForm } from "./NewProjectForm";

export const metadata = {
  title: "New project — Aphogato",
};

export default function NewProjectPage() {
  return (
    <main className="px-6 md:px-10 py-10 max-w-[560px] mx-auto">
      <h1 className="text-2xl font-light tracking-[0.05em] uppercase mb-2">
        New project
      </h1>
      <p className="text-text-secondary text-[13px] mb-10">
        Pull a Cloudinary folder into Aphogato and generate a gallery link for
        your client.
      </p>
      <NewProjectForm />
    </main>
  );
}
