# Student Attendance System - Setup Guide

## Overview
Sistem absensi siswa yang memungkinkan siswa mengajukan izin/sakit, izin jam pelajaran tertentu, dan izin terlambat dengan upload foto bukti.

## Features Implemented

### 1. Dashboard Siswa (`/siswa`)
- **Info Card**: Menampilkan NIS, Nomor Absen, Nama
- **Stats Card**: Statistik kehadiran bulan ini (H, S, I, A, Telat)
- **Action Buttons**:
  - Ajukan Izin/Sakit (dengan foto bukti wajib)
  - Izin Jam Pelajaran (pilih jam ke berapa sampai berapa)
  - Izin Terlambat (dengan foto bukti wajib)
- **Recent Submissions**: 5 pengajuan terakhir dengan status approval

### 2. Riwayat Absensi (`/siswa/riwayat`)
- **Date Range Filter**: Filter dari tanggal - sampai tanggal
- **Attendance List**: Semua riwayat kehadiran dengan:
  - Status badge (Hadir, Sakit, Izin, Alpha, Terlambat)
  - Approval status
  - Keterangan
  - Preview foto (click to enlarge)
- **Photo Preview Modal**: Full-size view foto bukti

### 3. Components Created
- `IzinModal`: Form izin/sakit dengan upload foto
- `IzinJamModal`: Form izin jam pelajaran tertentu
- `IzinTelatModal`: Form izin terlambat dengan upload foto
- Upload utils untuk handle Supabase storage

## Database Changes Required

### 1. Run SQL Schema
Jalankan file: `database/student_attendance_schema.sql`

```sql
-- Add foto_bukti column to attendance
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS foto_bukti TEXT;

-- Create izin_telat table
CREATE TABLE IF NOT EXISTS izin_telat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students_master(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  jam_datang TIME NOT NULL,
  foto_bukti TEXT NOT NULL,
  keterangan TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Supabase Storage Setup

**Create Storage Bucket:**
1. Go to Supabase Dashboard → Storage
2. Create new bucket: `bukti-surat-izin`
3. Set bucket to PUBLIC or configure RLS

**Configure RLS Policies (Optional):**

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bukti-surat-izin');

-- Public read access
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bukti-surat-izin');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'bukti-surat-izin' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## File Structure

```
app/siswa/
├── layout.tsx              # Layout with navigation
├── page.tsx                # Dashboard
└── riwayat/
    └── page.tsx            # Attendance history

components/
├── izin-modal.tsx          # Izin/Sakit form
├── izin-jam-modal.tsx      # Partial leave form
└── izin-telat-modal.tsx    # Late permission form

lib/
└── upload-utils.ts         # Supabase storage utilities

database/
└── student_attendance_schema.sql  # Database schema
```

## Usage Flow

### For Students:

1. **Login** → Redirect to `/siswa`
2. **Dashboard**: View stats and click action button:
   - **Ajukan Izin/Sakit**: 
     - Select date
     - Choose status (Sakit/Izin)
     - Upload foto bukti (REQUIRED)
     - Add keterangan (optional)
     - Submit
   
   - **Izin Jam Pelajaran**:
     - Select date
     - Choose jam ke (from - to)
     - Add keterangan: "Izin untuk apa?" (REQUIRED)
     - Submit
   
   - **Izin Terlambat**:
     - Select date
     - Input jam datang
     - Upload foto bukti (REQUIRED)
     - Add keterangan (optional)
     - Submit

3. **View History** → Navigate to Riwayat tab:
   - Filter by date range
   - View all records
   - Click photo to preview full size

### For Admin/Pengurus:

The `is_approved` field can be used to approve/reject submissions. You can add approval UI in admin/pengurus pages.

## Validation Rules

### Photo Upload:
- **Allowed formats**: JPG, PNG, WebP
- **Max size**: 5MB
- **Required for**: Izin/Sakit, Izin Telat
- **Not required for**: Izin Jam Pelajaran

### File Storage:
- Files organized by student_id: `{student_id}/{type}_{timestamp}.{ext}`
- Types: `sakit`, `izin`, `telat`

## Testing Checklist

- [ ] Database schema applied
- [ ] Storage bucket `bukti-surat-izin` created
- [ ] Login as siswa → redirects to `/siswa`
- [ ] Dashboard shows student info correctly
- [ ] Stats display current month data
- [ ] Izin/Sakit form:
  - [ ] Can upload photo
  - [ ] Photo preview works
  - [ ] File validation works (size, format)
  - [ ] Submit saves to attendance table with foto_bukti
- [ ] Izin Jam form:
  - [ ] Jam ke validation works
  - [ ] Saves to attendance + attendance_periods
- [ ] Izin Telat form:
  - [ ] Can upload photo
  - [ ] Saves to izin_telat table
- [ ] Riwayat page:
  - [ ] Date filter works
  - [ ] Shows all records
  - [ ] Photo preview modal works
  - [ ] Shows approval status

## Next Steps (Optional)

1. **Add Approval Workflow**:
   - Create admin/wali kelas page to approve/reject submissions
   - Send notifications when approved/rejected

2. **Add Notifications**:
   - Email/WhatsApp when submission is approved
   - Remind students to submit if absent

3. **Add Approval History**:
   - Track who approved and when
   - Add approval notes

4. **Add Export**:
   - Export attendance to Excel/PDF
   - Include photos in report

5. **Add Analytics**:
   - Most common reasons for absence
   - Attendance trends by student
