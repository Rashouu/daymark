interface Toast {
  msg: string;
  action?: { label: string; run: () => void };
}

export const toast = $state({ current: null as Toast | null });
let timer: ReturnType<typeof setTimeout>;

export function showToast(msg: string, action?: Toast['action']) {
  clearTimeout(timer);
  toast.current = { msg, action };
  timer = setTimeout(() => (toast.current = null), 6000);
}

export function dismissToast() {
  clearTimeout(timer);
  toast.current = null;
}
