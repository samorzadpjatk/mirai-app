import { toast } from "react-hot-toast";

export const appToast = {
  success(message: string) {
    return toast.success(message);
  },
  error(message: string) {
    return toast.error(message);
  },
  info(message: string) {
    return toast(message);
  },
  loading(message: string) {
    return toast.loading(message);
  },
  dismiss(id?: string) {
    return toast.dismiss(id);
  },
};
