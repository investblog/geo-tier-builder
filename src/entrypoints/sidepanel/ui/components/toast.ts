let timer: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, duration = 2000): void {
  const el = document.getElementById('toast');
  if (!el) return;

  if (timer) clearTimeout(timer);

  el.textContent = message;
  el.classList.add('toast--visible');

  timer = setTimeout(() => {
    el.classList.remove('toast--visible');
    timer = null;
  }, duration);
}
