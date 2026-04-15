# TeeBox Debug & Fix Task

## Current Work
Fixing validation and create/update handlers in src/app/(drawer)/(admin)/(tabs)/courses/teeBox.tsx

## Steps
- [ ] 1. Strengthen teeBoxSchema in src/schema/adminSchemas.ts (rating/slope validation)
- [ ] 2. Fix onSubmit in teeBox.tsx: add await updateTeeBox, consistent Toast, refetch after success
- [ ] 3. Fix modal submit Pressable: pass correct editingCourse.teeBoxId to onSubmit
- [ ] 4. Add submit loading state
- [ ] 5. Test create/edit functionality
- [ ] 6. Update TODO with results

Key fixes:
- Missing await on updateTeeBox
- Wrong teeBoxId reference (teeBox?.teeboxId -> editingCourse.teeBoxId)
- No refetch after create/update
- Weak number validation
