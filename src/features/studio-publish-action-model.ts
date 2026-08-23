export type StudioPublishActionState = Readonly<{
  status: "idle" | "error" | "conflict" | "pending";
  message: string;
}>;
