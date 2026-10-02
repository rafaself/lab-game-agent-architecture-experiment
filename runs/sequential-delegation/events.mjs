export function emit(game, type, details = {}) {
  game.events.push({ type, time: game.time, ...details });
  if (game.events.length > 500) game.events.splice(0, game.events.length - 500);
}

export function effect(game, kind, details, duration = 0.25) {
  game.effects.push({ kind, ...details, remaining: duration, duration });
}

export function drainEvents(game) {
  return game.events.splice(0);
}
