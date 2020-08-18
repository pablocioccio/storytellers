import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appExpandTextarea]'
})
export class ExpandTextareaDirective {

  constructor() { }

  @HostListener('input', ['$event.target'])
  onInput(textArea: HTMLTextAreaElement): void {
    this.adjust(textArea);
  }

  adjust(textarea: HTMLTextAreaElement) {
    /* Reset height in case text is being removed and not added */
    textarea.style.height = '';
    /* Expand to current scrollHeight + an additional 3px */
    textarea.style.height = `${textarea.scrollHeight + 3}px`;
  }

}
