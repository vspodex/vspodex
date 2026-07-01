---
description: Sign the firefox extension as listed.
---

JWT issuer: user:19933540:630
JWT secret: 34404f339cdfa68f6503d0634863c43de55747879f782c1892d422741fa9e013

Use the following command to sign the firefox extension. Credentials are above.

npx web-ext sign --channel=listed --api-key=<YOUR_AMO_JWT_ISSUER> --api-secret=<YOUR_AMO_JWT_SECRET> --source-dir dist/firefox

Bumped the version number only if there's a conflict and repeat the sign command.