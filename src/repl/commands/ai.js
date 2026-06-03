const chalk = require('chalk');

// Squares loader — rotating triangles (cliloaders.com squares_9)
const SPINNER_FRAMES = ['◢', '◣', '◤', '◥'];

class Spinner {
  constructor(text) {
    this.text = text;
    this.frame = 0;
    this.interval = null;
  }

  start() {
    this.frame = 0;
    process.stderr.write('\x1B[2m' + SPINNER_FRAMES[0] + '\x1B[0m ' + this.text);
    this.interval = setInterval(() => {
      process.stderr.write('\r\x1B[2m' + SPINNER_FRAMES[this.frame++ % SPINNER_FRAMES.length] + '\x1B[0m ' + this.text);
    }, 80);
    return this;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stderr.write('\r' + ' '.repeat(this.text.length + 4) + '\r');
  }
}

async function execute(args, context = {}) {
  if (!args || args.trim() === '') {
    return { output: chalk.yellow('Usage: ai <question>'), shouldExit: false };
  }

  const ai = context.ai;
  if (!ai) {
    return { output: chalk.yellow('AI not configured. Set GLM_API_KEY or run `adm setup`.'), shouldExit: false };
  }

  const spinner = new Spinner('Responding...').start();
  try {
    const response = await ai.query(args, { client: ai.client });
    spinner.stop();
    return { output: response, shouldExit: false };
  } catch (err) {
    spinner.stop();
    return { output: chalk.red(err.message), shouldExit: false };
  }
}

module.exports = { execute, description: 'Ask AI a question' };
