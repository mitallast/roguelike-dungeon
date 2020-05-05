export interface DialogConfig {
  readonly start: string[];
  readonly questions: Partial<Record<string, DialogQuestionConfig>>;
}

export interface DialogQuestionConfig {
  readonly text: string;
  readonly conditions?: [string];
  readonly answers: DialogAnswerConfig[];
}

export interface DialogAnswerConfig {
  readonly text: string;
  readonly conditions?: [string];
  readonly commands: string[];
}