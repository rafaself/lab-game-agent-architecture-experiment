import { updateGame, drainEvents } from './model.mjs';
import { screenKey } from './ui.mjs';

export function createFrameDriver(game, { input, audio, ui, render }) {
  let previousScreen = screenKey(game);
  return (elapsed, now) => {
    const before = screenKey(game);
    if (before !== previousScreen) input.clear();
    input.setEnabled(before === 'playing');
    updateGame(game, elapsed, input.sample());
    const after = screenKey(game);
    if (after !== before) input.clear();
    input.setEnabled(after === 'playing');
    const events = drainEvents(game);
    audio.consume(events);
    ui.update(game, events, now);
    render(game, input.pointer());
    previousScreen = after;
    return events;
  };
}
