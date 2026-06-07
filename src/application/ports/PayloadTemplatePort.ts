/** Driven port for loading named payload templates (questionnaires, issues). */
export interface PayloadTemplatePort {
  /** Load `templates/payloads/<name>`; throws (exit 3) if absent. */
  loadByName(name: string): Promise<string>;
}
