# Easy Check Deployment

The simplest free hosting option for this app is GitHub Pages.

## Files To Upload

Upload these files to a new GitHub repository:

- `index.html`

Optional source files:

- `preview.html`
- `SplitBillApp.tsx`
- `preview-server.js`

Only `index.html` is required for the online version.

## GitHub Pages Steps

1. Create a GitHub account, or sign in.
2. Create a new public repository, for example `easy-check`.
3. Upload `index.html` to the repository root.
4. Open repository `Settings`.
5. Go to `Pages`.
6. Under `Build and deployment`, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
7. Save.

Your app URL will look like:

```text
https://YOUR-GITHUB-USERNAME.github.io/easy-check/
```

## Notes

- GitHub Pages is free for public repositories.
- This app runs fully in the browser, so it does not need a server or database.
- "Free forever" cannot be guaranteed by any hosting provider, because free tiers can change, but GitHub Pages has been one of the most stable free static hosting options.
- Do not use this app to collect private financial data from other people. It only stores data in the current browser session.
