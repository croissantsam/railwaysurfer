export class StartScreen {
  private element: HTMLElement | null;
  private btnStart: HTMLElement | null;

  constructor(onStart: () => void) {
    this.element = document.getElementById('start-screen');
    this.btnStart = document.getElementById('btn-start');

    if (this.btnStart) {
      this.btnStart.addEventListener('click', (e) => {
        e.stopPropagation();
        onStart();
      });
    }
  }

  show(): void {
    this.element?.classList.add('active');
  }

  hide(): void {
    this.element?.classList.remove('active');
  }

  isVisible(): boolean {
    return !!this.element?.classList.contains('active');
  }
}
