# CLI, environment, requirements

Harness 3.x. Run every command from inside the target repository.

```bash
npm install -g hedera-harness
```

Both `harness` and `hedera-harness` are installed and are the same binary.

## Commands

```
harness init [--yes]
harness wizard [name] [--model NAME] [--yes]
harness run --spec <path> [--max-attempts N] [--max-spend USD]
                   [--model NAME] [--judge-model NAME] [--yes] [--json]
harness report [run] [--full]
```

| Command | What it does |
| --- | --- |
| `init` | Writes `harness.yaml` by asking four questions, with defaults read from `package.json` and the lockfile. Refuses if the file exists — edit it directly instead. Commits it |
| `wizard [name]` | An agent reads the project and works the four commands out itself, with a sentence of reasoning each, then interviews you one question at a time and drafts `specs/<name>.md` |
| `run --spec <path>` | Builds the feature described by a spec, and judges the result |
| `report [run]` | Reads a finished run — what it did, what the evaluator checked, and whether to believe it. Defaults to the latest |

There is no `doctor`, `validate`, or `migrate` command. DOCTOR is the first
stage of `run`.

## Flags

| Flag | Applies to | Default |
| --- | --- | --- |
| `--spec <path>` | `run` | **required** |
| `--max-attempts N` | `run` | `3`. A positive integer |
| `--max-spend USD` | `run` | unset — every stage is already bounded by a clock. Must be a positive number |
| `--model NAME` | `run`, `wizard` | `sonnet`. Also `opus`, `haiku`, or a full model id |
| `--judge-model NAME` | `run` | the same as `--model` |
| `--yes` | `init`, `wizard` | take the defaults without asking. Required when stdin is not a terminal; `init --yes` fails if it cannot detect a build or serve script |
| `--json` | `run` | one JSON object per line instead of the watchable output |
| `--review` | `run` | stop to confirm the checks read from the spec |
| `--continue` | `run` | carry on from this branch's last run |
| `--full` | `report` | include both agents' full tool feeds |

The watchable output and `--json` are two renderers reading the same event
stream, so neither can drift from the other. `--json` carries raw values —
`"costUsd": 0.48`, not `~$0.48 of tokens`.

## Environment

Machine-level settings are environment variables, deliberately kept out of
`harness.yaml`, which is shared with everyone who clones the repo.

| Variable | Effect |
| --- | --- |
| `HARNESS_MODEL` | Default agent model. Same as `--model` |
| `HARNESS_JUDGE_MODEL` | Default model for EVALUATE. Same as `--judge-model` |
| `HEDERA_SKILLS_DIR` | Extra skill plugins, for a project that ships none of its own. Unset by default — a scaffolded project carries its skills in `.claude/skills/` and they load automatically |
| `HEDERA_NETWORK` | `testnet` (default), `previewnet`, `mainnet` |
| `HEDERA_MIRROR_NODE` | Overrides the mirror node URL derived from the network |
| `HEDERA_OPERATOR_ID` | A funded testnet account the app can sign with. DOCTOR checks it exists and has a balance |
| `HEDERA_OPERATOR_KEY` | Its private key. Passed to the evaluator to import into the app, and scrubbed from every artifact. The harness never signs with it |
| `NO_COLOR` | Turns off colour. Already off when stdout is not a terminal |

## Requirements

- Node 20+
- git, and a repo with at least one commit and a **clean tree**
- A `package.json` at the repo root
- Claude Code credentials — a subscription login or `ANTHROPIC_API_KEY`
- Chromium for EVALUATE: `npx playwright install chromium`. DOCTOR says this if
  it is missing

## A first run, end to end

```bash
cd your-project
harness init                              # four questions → harness.yaml
$EDITOR specs/feature.md                  # your spec, in your words
harness run --spec specs/feature.md
harness report
```

With no spec yet, `harness wizard feature` replaces the first two steps: it
proposes the commands and interviews you into `specs/feature.md`.
