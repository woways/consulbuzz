# ConsulBuzz — Multi-tenant SaaS CRM (Prototype)

React + Vite + Tailwind. Client portal at `/`, hidden Super Admin at `/admin`.

## Run it

```bash
npm install
npm run dev
```

Then open:
- Client portal — http://localhost:5173/
- Super Admin login — http://localhost:5173/admin/login
- Demo credentials: `admin@consulbuzz.com` / `admin123`

## File structure

```
src/
├── App.jsx                       # Router
├── main.jsx                      # Entry
├── index.css                     # Tailwind
├── ClientPortal.jsx              # Client shell (sidebar + module routing)
├── SuperAdmin.jsx                # Admin shell (sidebar + section routing)
├── AdminLogin.jsx                # /admin/login page
│
├── data/
│   ├── tenants.js                # TENANTS, PLANS, MODULE_META
│   └── mock.js                   # All mock records (leads, admissions, etc.)
│
├── components/
│   └── ui.jsx                    # StatCard, Badge, Table, PlanPill, UpgradeGate
│
└── modules/
    ├── client/                   # ONE FILE PER MODULE
    │   ├── Dashboard.jsx
    │   ├── UTMLeads.jsx
    │   ├── Admissions.jsx
    │   ├── Revenue.jsx
    │   ├── LeadStore.jsx
    │   ├── Walkins.jsx           # Pro tier
    │   ├── Counselling.jsx       # Pro tier
    │   ├── Quotation.jsx         # Advanced tier
    │   ├── Negotiation.jsx       # Advanced tier
    │   ├── Analytics.jsx
    │   ├── Help.jsx
    │   └── Settings.jsx
    │
    └── admin/                    # ONE FILE PER ADMIN SECTION
        ├── AdminDashboard.jsx
        ├── Clients.jsx
        ├── Client360.jsx
        ├── Plans.jsx
        └── Support.jsx
```

## What each module owns

Every module in `modules/client/` is a self-contained React component. To edit the Counselling module, you open `modules/client/Counselling.jsx` — nothing else. Same for admin sections.

To add a new module:
1. Create `modules/client/NewModule.jsx`
2. Register it in `data/tenants.js` under `MODULE_META`
3. Add a case in `ClientPortal.jsx`'s `renderModule()` switch

## What to replace when you add a backend

Every `MOCK_*` array in `data/mock.js` becomes a database query. In each module file, replace:

```js
import { MOCK_LEADS } from '../../data/mock';
// ...
const leads = MOCK_LEADS;
```

with:

```js
const [leads, setLeads] = useState([]);
useEffect(() => {
  fetch('/api/leads').then(r => r.json()).then(setLeads);
}, []);
```

Delete `data/mock.js` entirely once every module is wired to real data.

## Security note

The `/admin` login is client-side and demo-only. Anyone reading the JS bundle can bypass it. Before deploying anywhere real, replace `AdminLogin.jsx` with real backend auth.
