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
      <p className="text-text-secondary text-[15px] mb-10 leading-relaxed">
        Set up a gallery for your client. On the next screen, add your photos
        and share the link when you&rsquo;re ready.
      </p>
      <NewProjectForm />
    </main>
  );
}
