export interface ProfileDraft {
  name: string;
  motto: string;
}

export interface ProfileValidationFailure {
  field: "name" | "motto";
  message: string;
}

export function validateProfileDraft(draft: ProfileDraft): ProfileValidationFailure | undefined {
  const name = draft.name.trim();
  if (name.length < 2 || name.length > 32) {
    return { field: "name", message: "Commander name must be between 2 and 32 characters." };
  }
  if (hasControlCharacters(name)) {
    return { field: "name", message: "Commander name cannot contain control characters." };
  }
  if (draft.motto.length > 80) {
    return { field: "motto", message: "Motto must be 80 characters or fewer." };
  }
  if (hasControlCharacters(draft.motto)) {
    return { field: "motto", message: "Motto cannot contain control characters." };
  }
  return undefined;
}

function hasControlCharacters(value: string): boolean {
  for (const character of value) {
    if (character.charCodeAt(0) < 32) {
      return true;
    }
  }
  return false;
}

export function normalizeProfileDraft(draft: ProfileDraft): ProfileDraft {
  return {
    name: draft.name.trim(),
    motto: draft.motto.trim(),
  };
}
