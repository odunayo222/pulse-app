import type { Form, FormResponse } from "@/types/form";

export const mockForm: Form = {
  form_id: "form-001",
  version: 1,
  title: "Sprint Feedback",
  type: "feedback",
  status: "draft",
  settings: {
    anonymous: true,
    one_response: false,
    deadline: null,
  },
  questions: [
    {
      id: "question-001",
      type: "rating",
      label: "How was the sprint overall?",
      help_text: "Rate your experience from 1 to 5.",
      required: true,
      config: {
        min: 1,
        max: 5,
      },
    },
    {
      id: "question-002",
      type: "long_text",
      label: "What slowed us down?",
      required: true,
      config: {
        max_length: 2000,
      },
    },
    {
      id: "question-003",
      type: "multiple_choice",
      label: "Which area needs the most attention?",
      help_text: "Choose the area that needs the most improvement.",
      required: false,
      config: {
        options: ["Tooling", "Scope", "Reviews", "Testing"],
        allow_multiple_answers: false,
      },
    },
    {
      id: "question-004",
      type: "short_text",
      label: "Anything you want to flag to leads?",
      required: false,
      config: {
        max_length: 255,
      },
    },
    {
      id: "question-005",
      type: "file_upload",
      label: "Attach anything that backs this up",
      help_text: "PDF, DOC or DOCX, up to 5 MB.",
      required: false,
      config: {
        max_file_size_mb: 5,
        allowed_file_types: [".pdf", ".doc", ".docx"],
      },
    },
  ],
};

export const mockForms: Form[] = [
  mockForm,
  {
    form_id: "form-002",
    version: 1,
    title: "New Employee Feedback",
    share_slug: "new-employee-feedback",
    type: "feedback",
    status: "published",
    settings: {
      anonymous: false,
      one_response: true,
      deadline: null,
    },
    questions: [
      {
        id: "question-006",
        type: "short_text",
        label: "What is your name?",
        required: true,
        config: {
          max_length: 255,
        },
      },
      {
        id: "question-007",
        type: "rating",
        label: "How was your onboarding experience?",
        required: true,
        config: {
          min: 1,
          max: 5,
        },
      },
    ],
  },
  {
    form_id: "form-003",
    version: 1,
    title: "Office Snack Poll",
    share_slug: "office-snack-poll",
    type: "poll",
    status: "closed",
    settings: {
      anonymous: false,
      one_response: true,
      deadline: null,
    },
    questions: [
      {
        id: "question-008",
        type: "multiple_choice",
        label: "Which snack should we stock?",
        required: true,
        config: {
          options: ["Biscuits", "Fruit", "Popcorn", "Yoghurt"],
          allow_multiple_answers: false,
        },
      },
    ],
  },
];

/* ---------- Seeded responses (so results pages have something to show) ---------- */

const names = ["Ada", "Tolu", "Segun", "Chidi", "Ife", "Bola", "Kemi", "Femi"];
const snacks = ["Biscuits", "Fruit", "Popcorn", "Yoghurt"];

// Deterministic, so every reload shows the same numbers
export const mockResponses: FormResponse[] = [
  ...names.map((name, i) => ({
    id: `response-002-${i + 1}`,
    form_id: "form-002",
    submitted_at: new Date(Date.UTC(2026, 10, 3 + i, 9 + i, 15)).toISOString(),
    answers: [
      { questionId: "question-006", value: name },
      { questionId: "question-007", value: [4, 5, 3, 4, 5, 2, 4, 5][i] },
    ],
  })),
  ...Array.from({ length: 14 }, (_, i) => ({
    id: `response-003-${i + 1}`,
    form_id: "form-003",
    submitted_at: new Date(Date.UTC(2026, 8, 10 + (i % 5), 12, i * 3)).toISOString(),
    answers: [{ questionId: "question-008", value: [snacks[[0, 1, 1, 2, 0, 1, 3, 1, 2, 1, 0, 1, 2, 1][i]]] }],
  })),
];
