"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Check, Copy, Send } from "lucide-react";
import { useId, useState } from "react";
import { RollText } from "@/components/ui/roll-text";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

const topics = ["Full-time role", "Freelance project", "Collaboration", "Something else"] as const;

interface Fields {
  name: string;
  topic: (typeof topics)[number];
  message: string;
}
type Errors = Partial<Record<"name" | "message", string>>;

function validate(f: Fields): Errors {
  const errors: Errors = {};
  if (f.name.trim().length < 2) errors.name = "Please add your name.";
  if (f.message.trim().length < 20) errors.message = "A sentence or two (20+ characters) helps me reply properly.";
  return errors;
}

/**
 * Composes an email in the visitor's own mail app — there is no server here,
 * and the UI says so. Validation runs on submit, then live as fields change.
 */
export function ContactForm({ email }: { email: string }) {
  const uid = useId();
  const [fields, setFields] = useState<Fields>({ name: "", topic: topics[0], message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "opened">("idle");
  const [copied, setCopied] = useState(false);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    const next = { ...fields, [key]: value };
    setFields(next);
    if (submitted) setErrors(validate(next));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = found.name ? "name" : "message";
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    const subject = `${fields.topic} — from ${fields.name.trim()}`;
    const body = `${fields.message.trim()}\n\n— ${fields.name.trim()}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus("opened");
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard unavailable — the address is visible on screen anyway. */
    }
  }

  const field =
    "w-full rounded-xl border bg-ink-950/60 px-4 py-3 text-[0.9375rem] text-fg placeholder:text-subtle transition-[border-color,box-shadow] duration-300 outline-none focus:border-accent/60 focus:shadow-[0_0_0_4px_rgb(91_140_255/0.12)]";

  return (
    <div data-spotlight className="spotlight surface rounded-3xl p-6 sm:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {status === "opened" ? (
          <motion.div
            key="done"
            role="status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease }}
            className="flex min-h-[22rem] flex-col items-start justify-center"
          >
            <span className="grid size-12 place-items-center rounded-full border border-ok/30 bg-ok/10 text-ok">
              <Check className="size-5" aria-hidden />
            </span>
            <h3 className="mt-6 text-2xl font-medium tracking-tight text-fg">Your email app should be open.</h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Your message is drafted and ready to send from your own inbox. If nothing opened, write to me directly at{" "}
              <span className="text-fg">{email}</span>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyEmail}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm text-fg transition-colors hover:border-accent/60"
              >
                {copied ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {copied ? "Copied" : "Copy email address"}
              </button>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="min-h-11 rounded-full px-4 text-sm text-muted transition-colors hover:text-fg"
              >
                Edit message
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease }}
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id={`${uid}-name`} label="Your name" error={errors.name}>
                <input
                  id={`${uid}-name`}
                  name="name"
                  autoComplete="name"
                  value={fields.name}
                  onChange={(e) => update("name", e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? `${uid}-name-error` : undefined}
                  placeholder="Ada Lovelace"
                  className={cn(field, errors.name ? "border-red-400/60" : "border-line")}
                />
              </Field>
              <Field id={`${uid}-topic`} label="What's it about?">
                <select
                  id={`${uid}-topic`}
                  name="topic"
                  value={fields.topic}
                  onChange={(e) => update("topic", e.target.value as Fields["topic"])}
                  className={cn(field, "border-line appearance-none")}
                >
                  {topics.map((t) => (
                    <option key={t} value={t} className="bg-ink-900">
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field id={`${uid}-message`} label="Message" error={errors.message}>
              <textarea
                id={`${uid}-message`}
                name="message"
                rows={5}
                data-lenis-prevent
                value={fields.message}
                onChange={(e) => update("message", e.target.value)}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? `${uid}-message-error` : `${uid}-message-hint`}
                placeholder="A little about the role or project, timeline and how I can help."
                className={cn(field, "resize-y", errors.message ? "border-red-400/60" : "border-line")}
              />
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <p id={`${uid}-message-hint`} className="max-w-xs text-xs leading-relaxed text-subtle">
                Opens your email app with this message drafted — nothing is sent or stored by this site.
              </p>
              <button
                type="submit"
                className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-ink-950 shadow-[0_8px_30px_-8px_rgb(91_140_255/0.55)] transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-[0_10px_40px_-6px_rgb(91_140_255/0.75)]"
              >
                <RollText>Compose email</RollText>
                <Send
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label-mono mb-2 block text-subtle">
        {label}
      </label>
      {children}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease }}
            className="flex items-center gap-1.5 overflow-hidden pt-2 text-xs text-red-300"
          >
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
