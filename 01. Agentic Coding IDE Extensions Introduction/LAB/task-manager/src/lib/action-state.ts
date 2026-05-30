export type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: {
    title?: string;
    dueDate?: string;
  };
};

export const initialActionState: ActionState = {
  ok: false,
  message: "",
};
