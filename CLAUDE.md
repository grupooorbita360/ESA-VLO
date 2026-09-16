# Workflow notes for Claude

- Development happens on a feature branch (currently `claude/practical-davinci-c0aut5`).
- Once the user approves a change on that branch, merge it into `main` immediately without asking again first — this is a standing authorization, not a one-time approval. Use a fast-forward merge when possible; if `main` and the branch have diverged, merge normally and resolve conflicts, asking the user only if resolving them requires a judgment call.
- Still never force-push, rewrite history, or push anything the user hasn't approved.
