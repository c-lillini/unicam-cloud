import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CompareView } from './components/compare-view';
import { TokenizeView } from './components/tokenize-view';

type View = 'tokenize' | 'compare';

@Component({
  selector: 'app-root',
  imports: [TokenizeView, CompareView],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly view = signal<View>('tokenize');
}
