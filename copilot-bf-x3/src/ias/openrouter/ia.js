import { PROMPT_BF } from '../../config.js';
export const prompt = PROMPT_BF;
export const query = () => process.argv.slice(2).join(" ") || "Quien te creo?";
