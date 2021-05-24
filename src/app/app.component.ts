import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { decode } from 'blurhash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'blurhash-generator-extension';
  blurhash: any = 'loading';

  @ViewChild('canv', { static: true }) canvasEle: ElementRef;

  constructor(private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    chrome.storage.sync.get(['info'], (result) => {
      this.blurhash = result.info;

      const pixels = decode(this.blurhash, 32, 32);

      const ctx = this.canvasEle.nativeElement.getContext('2d');
      const imageData = ctx.createImageData(32, 32);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
      ctx.scale(9.3, 7.5);
      ctx.drawImage(this.canvasEle.nativeElement, 0, 0);
      this.cdr.detectChanges();
      // alert(result.info);
    });
  }
}
