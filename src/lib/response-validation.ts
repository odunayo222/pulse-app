import type {
  AnswerValue,
  FileAnswer,
  FormQuestion,
  SubmitAnswer,
} from "@/types/form";

/* ---------- Helpers ---------- */

export function isEmptyAnswer(value: AnswerValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false; // numbers (ratings) are never "empty"
}

/** "pdf" and ".pdf" both become "pdf" */
export function normaliseExtension(type: string): string {
  return type.trim().toLowerCase().replace(/^\./, "");
}

export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Why a file is not allowed for this question, or null if it is fine. */
export function validateFile(
  question: FormQuestion,
  file: Pick<FileAnswer, "name" | "size">,
): string | null {
  const allowed = (question.config?.allowed_file_types ?? []).map(
    normaliseExtension,
  );
  const maxMb = question.config?.max_file_size_mb ?? 5;
  const ext = fileExtension(file.name);

  if (allowed.length > 0 && !allowed.includes(ext)) {
    return `.${ext || "?"} files are not accepted. Use ${allowed
      .map((a) => a.toUpperCase())
      .join(", ")}.`;
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `That file is ${formatFileSize(file.size)}. The limit is ${maxMb} MB.`;
  }
  return null;
}

/* ---------- One answer ---------- */

/**
 * Checks one answer against its question's rules.
 * Returns a message for the respondent, or null when the answer is valid.
 * Used by the response page (inline errors) AND the mock API (server-side
 * check), so both always agree.
 */
export function validateAnswer(
  question: FormQuestion,
  value: AnswerValue,
): string | null {
  if (isEmptyAnswer(value)) {
    return question.required
      ? "This question needs an answer before you can submit."
      : null;
  }

  const config = question.config ?? {};

  switch (question.type) {
    case "short_text":
    case "long_text": {
      if (typeof value !== "string") return "Enter text.";
      const max = config.max_length;
      if (max && value.length > max) {
        return `Keep it to ${max.toLocaleString()} characters (you have ${value.length.toLocaleString()}).`;
      }
      return null;
    }

    case "multiple_choice": {
      const options = config.options ?? [];
      const picked = Array.isArray(value) ? value : [value];
      if (!config.allow_multiple_answers && picked.length > 1) {
        return "Choose one option.";
      }
      if (picked.some((p) => typeof p !== "string" || !options.includes(p))) {
        return "Choose one of the listed options.";
      }
      return null;
    }

    case "rating": {
      const min = config.min ?? 1;
      const max = config.max ?? 5;
      if (typeof value !== "number" || value < min || value > max) {
        return `Choose a rating between ${min} and ${max}.`;
      }
      return null;
    }

    case "file_upload": {
      if (!Array.isArray(value)) return "Attach a file.";
      for (const file of value as FileAnswer[]) {
        const problem = validateFile(question, file);
        if (problem) return problem;
      }
      return null;
    }
  }
}

/** Validates every question. Returns { [questionId]: message } for failures. */
export function validateAllAnswers(
  questions: FormQuestion[],
  answers: Record<string, AnswerValue>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const question of questions) {
    const problem = validateAnswer(question, answers[question.id] ?? null);
    if (problem) errors[question.id] = problem;
  }
  return errors;
}

/** Shapes local state into the API's SubmitResponseDto.answers (skips blanks). */
export function toSubmitAnswers(
  questions: FormQuestion[],
  answers: Record<string, AnswerValue>,
): SubmitAnswer[] {
  return questions.flatMap((question) => {
    const value = answers[question.id] ?? null;
    if (isEmptyAnswer(value)) return [];

    if (question.type === "multiple_choice") {
      const selected = Array.isArray(value)
        ? value
        : typeof value === "string"
          ? [value.trim()]
          : [];
      if (selected.length === 0) return [];
      return [{ questionId: question.id, value: selected }];
    }
    
    const clean = typeof value === "string" ? value.trim() : value;
    return [{ questionId: question.id, value: clean as SubmitAnswer["value"] }];
  });
}

/* ---------- API errors → per-question errors ---------- */

/**
 * The API reports invalid answers as strings in `details`, e.g.
 *   "Question 0000-...-0102 (Sprint rating): must be between 1 and 5"
 * This pulls out the question id and the message so we can show each error
 * under its own question. Anything that does not match goes in `general`.
 */
export function mapApiAnswerErrors(details: string[]): {
  byQuestion: Record<string, string>;
  general: string[];
} {
  const byQuestion: Record<string, string> = {};
  const general: string[] = [];

  for (const detail of details) {
    const match = /^Question (\S+) \(.*?\): (.+)$/.exec(detail);
    if (match) {
      const [, questionId, message] = match;
      byQuestion[questionId] =
        message.charAt(0).toUpperCase() + message.slice(1);
    } else {
      general.push(detail);
    }
  }

  return { byQuestion, general };
}
