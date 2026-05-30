export type ActionState = {
  ok: boolean;
  message: string;
  nonce?: number;
  fieldErrors?: {
    title?: string;
    dueDate?: string;
  };
};

export const initialActionState: ActionState = {
  ok: false,
  message: "",
};
