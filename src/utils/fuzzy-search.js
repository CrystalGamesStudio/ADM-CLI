function matchCommands(query, commands) {
  if (!query) return commands;

  const lower = query.toLowerCase();

  const prefixMatches = commands.filter(cmd => cmd.name.startsWith(lower));
  if (prefixMatches.length > 0) return prefixMatches;

  const fuzzyMatches = commands.filter(cmd => {
    const name = cmd.name.toLowerCase();
    let qi = 0;
    for (let ci = 0; ci < name.length && qi < lower.length; ci++) {
      if (name[ci] === lower[qi]) qi++;
    }
    return qi === lower.length;
  });
  return fuzzyMatches;
}

module.exports = { matchCommands };
