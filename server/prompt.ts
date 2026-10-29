import type { AiGenerationRequest } from '../shared/types';
import { DISCIPLINE_LABELS } from '../shared/types';
import { TECHNIQUE_BY_ID, renderTechniqueName } from '../shared/techniques';

export function buildAiPrompt(
  request: AiGenerationRequest,
  allowedTechniques: Set<string>,
): { system: string; user: string } {
  const techniqueLines = [...allowedTechniques]
    .map((id) => {
      const technique = TECHNIQUE_BY_ID.get(id);
      if (!technique) return null;
      return `${id} = ${renderTechniqueName(technique, request.stance)}`;
    })
    .filter((line): line is string => Boolean(line))
    .join('\n');

  const system = `You are the head striking coach for STRIKR, a combat-sports training app.
You design safe, realistic, technically coherent combinations for ${DISCIPLINE_LABELS[request.discipline]}.
Rules that must never be broken:
1. Use ONLY technique IDs from the allowed list. Never invent an ID or a technique.
2. Respect the discipline, fighter level, stance, and focus.
3. Each combination has 2 to 6 moves. No wall of moves.
4. Combinations must flow naturally and be practical to shadowbox.
5. Return ONLY raw JSON. No markdown, no code fences, no commentary.

The fighter: ${DISCIPLINE_LABELS[request.discipline]}, ${request.stance} stance, ${request.level} level, focus on ${request.focus}.
Allowed technique IDs:
${techniqueLines}`;

  const user =
    request.mode === 'plan'
      ? `Design a coherent shadowboxing session built from exactly ${request.count} distinct combinations.
Return this exact JSON shape:
{
  "combinations": [
    { "name": "short combo name", "steps": ["allowed-id", "allowed-id"], "focus": "${request.focus}", "level": "${request.level}" }
  ]
}
The session rounds and timings are chosen separately, so do not include them. Every combination must be distinct, practical, and use only allowed technique IDs.`
      : `Generate exactly ${request.count} distinct combinations for this fighter.
Return this exact JSON shape:
{
  "combinations": [
    { "name": "short combo name", "steps": ["allowed-id", "allowed-id", "allowed-id"], "focus": "${request.focus}", "level": "${request.level}" }
  ]
}
Every combination must be distinct and use only allowed technique IDs.`;

  return { system, user };
}
