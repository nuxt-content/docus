---
name: docus-playground
description: Sample skill for testing the Docus agent skills discovery feature. Use to verify that /.well-known/agent-skills/ routes work correctly.
metadata:
  author: docus
  version: "1.0"
---

# Docus Playground Skill

This is a sample skill used to test the agent skills discovery feature in the Docus playground.

## Verify Discovery

Check these endpoints:

- `GET /.well-known/agent-skills/index.json` -- should list this skill
- `GET /.well-known/agent-skills/docus-playground.tar.gz` -- should return an archive containing this file and its references

For more details, see [references/example.md](references/example.md).
