# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Member Access and Data Reports

Apply the migrations in `supabase/migrations/` to the linked Supabase project before enabling registration and uploads. The live schema was checked through the Supabase Management API: the referenced finance tables and columns exist, `pengurus_roles.user_id` is the primary key, and its role check permits only `bendahara`/`pengurus` before the member migration. The proof bucket exists and previously had no file-size limit.

The migrations set proof bucket uploads to 2 MiB. The member migration widens the role check, links each new Auth user to one active existing member by the signup name, and enforces one account/email per member in a private mapping table. Legacy accounts without a role are linked only when their stored signup name matches exactly one active roster member; existing assigned roles are preserved. Member finance writes are blocked by database triggers. The migration also creates `data_reports` and its RLS policies. A Member may report a transaction/member record; Bendahara can mark a report reviewed. Finance read policies are extended for assigned roles without changing the currently enabled RLS state.

```powershell
npx.cmd supabase db push
npx.cmd supabase functions deploy scan-receipt
npx.cmd supabase functions deploy ai-assistant
```

The app rejects proof and chat images larger than 2 MiB before upload. The Storage bucket and deployed AI Edge Functions enforce the same maximum server-side. Existing stored files are not deleted.

## Manual Verification

- Register with the name of an active existing member and a new email, verify the address if Supabase requires it, then confirm `pengurus_roles.role` is `member`.
- Try registering a second email with the same member name; the database must reject the duplicate link.
- Confirm proof/receipt/chat image files above 2 MiB are rejected and the Storage bucket limit is 2 MiB.
- As Member, open Dashboard, Anggota, Transaksi, Laporan Bulanan, and Laporan Kesalahan. Submit a report and confirm its status is `pending`.
- As Bendahara, open Laporan Kesalahan and mark the report reviewed. Confirm the member sees the reviewed status.
- While signed in as Member, attempt an insert/update/delete against a finance table through the Supabase client; the database trigger must reject it.
- Complete or skip the first-login tutorial, sign out/in, and confirm it stays dismissed. Reopen it using Panduan.
- At 320px, 375px, and 430px viewport widths, open and close Notifications and verify the panel remains within the viewport.
- Run `npm run lint` and `npm run build`.
