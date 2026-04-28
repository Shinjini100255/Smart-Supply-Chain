# Security Specification for Smart Supply Chain

## 1. Data Invariants
- A shipment must have valid geographic coordinates.
- Risk level must be a decimal between 0 and 1.
- Status must follow the predefined logistics enum.
- Shipments are globally readable by any authenticated user in this monitoring dash.
- Only authenticated users can update shipment locations (simulating the tracking hardware).

## 2. The Dirty Dozen (Vulnerability Test Payloads)

1. **Identity Spoofing**: Attempt to set `ownerId` or similar field (not applicable here as it's global, but good practice).
2. **Type Poisoning**: Sending `lat: "London"` (string instead of number).
3. **Boundary Breach**: Sending `risk: 1.5` (out of range).
4. **Enum Injection**: Sending `status: "Exploded"` (not in enum).
5. **Shadow Field**: Sending `isVerified: true` to bypass verification checks.
6. **Large Payload**: Sending a 1MB string into `destination`.
7. **Path Poisoning**: Attempting to write to `shipments/%2e%2e%2fother_collection`.
8. **Unauthenticated Write**: Writing without a token.
9. **Update Gap**: Changing the `id` of a shipment during update.
10. **Denial of Wallet**: Rapidly creating 10,000 shipments (Needs rate limits/size checks).
11. **Timestamp Spoof**: Sending a backdated `lastUpdated`.
12. **Recursive Loop**: Attempting to trigger recursive triggers by updating self (N/A in rules).

## 3. Implementation Check
- [x] All coordinates are `number`.
- [x] Risk is `number` and bounded `[0,1]`.
- [x] Status is `list` membership checked.
- [x] Authenticated reads/writes only.
