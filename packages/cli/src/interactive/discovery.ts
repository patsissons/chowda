import { confirm, intro, isCancel, note, outro, select } from "@clack/prompts";
import { Command } from "commander";

export async function runDiscovery(program: Command): Promise<void> {
  intro("chowda CLI discovery");

  const action = await select({
    message: "Choose a command to start with",
    options: [
      { label: "Feed (hottest/newest/active)", value: "feed" },
      { label: "Search stories", value: "search" },
      { label: "Fetch one story", value: "story" },
      { label: "Show full help", value: "help" },
      { label: "Exit", value: "exit" }
    ]
  });

  if (isCancel(action) || action === "exit") {
    outro("No changes made.");
    return;
  }

  if (action === "help") {
    program.outputHelp();
    outro("Use `pnpm --silent cli <command> --help` for command-level help.");
    return;
  }

  const examples: Record<string, string> = {
    feed: "pnpm --silent cli feed hottest --json | jq '.[0]'",
    search: "pnpm --silent cli search rust ffi --json | jq '.[].title'",
    story: "pnpm --silent cli story abc123 --json | jq '.title'"
  };

  note(examples[action], "Example");

  const showHelp = await confirm({
    message: "Show full CLI help now?",
    initialValue: false
  });

  if (isCancel(showHelp)) {
    outro("Cancelled.");
    return;
  }

  if (showHelp) {
    program.outputHelp();
  }

  outro("Discovery complete.");
}
