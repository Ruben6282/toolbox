import { toast } from "sonner";

type PromiseMessages<T = unknown> = {
  loading?: string;
  success?: string | ((data: T) => string);
  error?: string | ((err: unknown) => string);
};

export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.message(message),
  // Some versions of sonner may not have warning; gracefully degrade to message
  warning: (message: string) => {
    const t = toast as unknown as { warning?: (m: string) => void; message: (m: string) => void };
    if (typeof t.warning === "function") {
      t.warning(message);
    } else {
      t.message(message);
    }
  },
  loading: (message: string) => toast.loading(message),

  // Wrap a promise with toast lifecycle states
  promise: async <T>(p: Promise<T>, messages: PromiseMessages<T>) => {
    const id = toast.loading(messages.loading ?? "Working...");
    try {
      const data = await p;
      const msg = typeof messages.success === "function" ? messages.success(data) : (messages.success ?? "Done");
      toast.success(msg, { id });
      return data;
    } catch (err) {
      const msg = typeof messages.error === "function" ? messages.error(err) : (messages.error ?? "Something went wrong");
      toast.error(msg, { id });
      throw err;
    }
  },
};

export default notify;
