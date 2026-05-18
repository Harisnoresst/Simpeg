<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|unique:users',
                'password' => 'required|string|min:6|confirmed',
                'role' => 'required|in:admin,guru',
                'nip' => 'nullable|string|unique:users',
            ]);

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'nip' => $request->nip ?: null,
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;
            return response()->json(['data' => $user, 'access_token' => $token, 'token_type' => 'Bearer']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal daftar: ' . $e->getMessage()], 500);
        }
    }

    public function login(Request $request)
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Email atau Password salah'], 401);
        }
        $user = User::where('email', $request->email)->firstOrFail();
        $user->update(['last_login' => now()]);
        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json([
            'access_token' => $token, 
            'token_type' => 'Bearer', 
            'user' => $user
        ]);
    }

    public function me() { return response()->json(auth()->user()); }
    public function logout() { auth()->user()->tokens()->delete(); return response()->json(['message' => 'Logout berhasil']); }

    public function storeAttendance(Request $request)
{
    try {
        $settings = DB::table('app_settings')->where('id', 1)->first();
        $tz = $settings ? $settings->zona_waktu : 'Asia/Jakarta';
        $wajibFoto = $settings ? $settings->foto_selfie : true;

        $request->validate([
            'type' => 'required|in:masuk,pulang',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'photo' => $wajibFoto ? 'required|string' : 'nullable|string',
            'distance' => 'required|numeric',
            // is_face_valid tidak wajib di-validate ketat, kita pakai nilai default saja nanti
        ]);

        $user = auth()->user();
        $today = now()->timezone($tz)->toDateString();
        $timeNow = now()->timezone($tz)->toTimeString();
        $batasMasuk = $settings ? $settings->batas_masuk : '07:30:00';

        // 1. Olah Foto
        $photoUrl = null;
        if ($request->photo) {
            $imageParts = explode(";base64,", $request->photo);
            $imageBase64 = base64_decode($imageParts[1]);
            $fileName = 'absensi/' . $user->id . '_' . time() . '.jpg';
            \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, $imageBase64);
            $photoUrl = asset('storage/' . $fileName);
        }

        // 2. Cek apakah sudah ada data hari ini
        $existing = DB::table('attendances')
            ->where('user_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        // Tangkap status deteksi wajah dari React (default 1 / true jika kosong)
        $isFaceValid = $request->input('is_face_valid', 1);

        if ($request->type === 'masuk') {
            $status = $timeNow > $batasMasuk ? 'terlambat' : 'hadir';

            if ($existing && $existing->check_in_time != null) {
                // Jika sudah ada jam masuk dan Absen Ganda MATI, maka tolak
                if ($settings && !$settings->absen_ganda) {
                    return response()->json(['message' => 'Anda sudah absen masuk hari ini.'], 400);
                }
                // Jika Absen Ganda AKTIF, kita UPDATE jam masuknya
                DB::table('attendances')->where('id', $existing->id)->update([
                    'check_in_time' => $timeNow,
                    'check_in_photo' => $photoUrl ?: $existing->check_in_photo,
                    'status' => $status,
                    'is_face_valid' => $isFaceValid, // <-- SIMPAN STATUS AI
                    'updated_at' => now()->timezone($tz)
                ]);
            } else {
                // Belum ada data sama sekali, baru INSERT
                DB::table('attendances')->insert([
                    'user_id' => $user->id,
                    'date' => $today,
                    'status' => $status,
                    'check_in_time' => $timeNow,
                    'check_in_lat' => $request->lat,
                    'check_in_lng' => $request->lng,
                    'check_in_photo' => $photoUrl,
                    'distance_check_in' => $request->distance,
                    'is_face_valid' => $isFaceValid, // <-- SIMPAN STATUS AI
                    'created_at' => now()->timezone($tz),
                    'updated_at' => now()->timezone($tz)
                ]);
            }
        } else {
            // LOGIKA PULANG
            if (!$existing) {
                return response()->json(['message' => 'Anda harus absen masuk terlebih dahulu.'], 400);
            }

            // Jika absen masuknya sudah tidak valid (0), jangan diubah jadi valid lagi saat pulang
            $finalFaceStatus = ($existing->is_face_valid == 0) ? 0 : $isFaceValid;

            DB::table('attendances')->where('id', $existing->id)->update([
                'check_out_time' => $timeNow,
                'check_out_lat' => $request->lat,
                'check_out_lng' => $request->lng,
                'check_out_photo' => $photoUrl ?: $existing->check_out_photo,
                'distance_check_out' => $request->distance,
                'is_face_valid' => $finalFaceStatus, 
                'updated_at' => now()->timezone($tz)
            ]);
        }

        return response()->json(['message' => 'Berhasil disimpan!', 'time' => substr($timeNow, 0, 5)]);

    } catch (\Exception $e) {
        return response()->json(['message' => 'Error Server: ' . $e->getMessage()], 500);
    }
}

    public function attendanceHistory()
    {
        $user = auth()->user();
        $history = DB::table('attendances')->where('user_id', $user->id)->orderBy('date', 'desc')->get();
        return response()->json($history);
    }

    public function dashboard()
    {
        $user = auth()->user();
        $settings = \Illuminate\Support\Facades\DB::table('app_settings')->where('id', 1)->first();
        $tz = $settings ? $settings->zona_waktu : 'Asia/Jakarta';
        $today = now()->timezone($tz)->toDateString(); 
        $school = \App\Models\School::find($user->school_id) ?: (\Illuminate\Support\Facades\Schema::hasTable('schools') ? \App\Models\School::first() : null);
        $todayAttendance = \Illuminate\Support\Facades\Schema::hasTable('attendances') 
            ? \Illuminate\Support\Facades\DB::table('attendances')->where('user_id', $user->id)->whereDate('date', $today)->first() 
            : null;
        
        $summary = ['hadir' => 0, 'terlambat' => 0, 'tidakHadir' => 0, 'izin' => 0];
        
        if (\Illuminate\Support\Facades\Schema::hasTable('attendances')) {
            $weekData = \Illuminate\Support\Facades\DB::table('attendances')
                ->where('user_id', $user->id)
                ->whereDate('date', '>=', now()->timezone($tz)->startOfWeek())
                ->get();
                
            $summary['hadir'] = $weekData->where('status', 'hadir')->count();
            $summary['terlambat'] = $weekData->where('status', 'terlambat')->count();
            $summary['tidakHadir'] = $weekData->whereIn('status', ['tidak_hadir', 'tidak hadir'])->count();
            $summary['izin'] = $weekData->whereIn('status', ['izin', 'sakit', 'cuti'])->count();
        }

    $settings = \Illuminate\Support\Facades\DB::table('app_settings')->where('id', 1)->first();

    return response()->json([
        'today_attendance' => $todayAttendance, 
        'week_summary' => $summary,
        'school' => [
            'name' => ($settings && !empty($settings->nama_instansi)) ? $settings->nama_instansi : 'Instansi Belum Diatur',
            'latitude' => $settings->latitude ?? null,
            'longitude' => $settings->longitude ?? null,
            'allowed_radius_meters' => $settings->radius_lokasi ?? 100,
            'validasi_lokasi' => $settings->validasi_lokasi ?? 1,
        ]
    ]);
}

    public function profileDetails()
    {
        $user = auth()->user();
        $school = School::find($user->school_id);
        
        $hadir = 0; $terlambat = 0;
        if (Schema::hasTable('attendances')) {
             $hadir = DB::table('attendances')->where('user_id', $user->id)->where('status', 'hadir')->count();
             $terlambat = DB::table('attendances')->where('user_id', $user->id)->where('status', 'terlambat')->count();
        }
    
        return response()->json([
        'pekerjaan' => [
            'tanggalMulai' => $user->tanggal_mulai ?: '-',
            'pendidikan' => $user->pendidikan ?: '-',
            'status' => $user->status_pegawai ?: '-',
            'golongan' => $user->golongan ?: '-'
        ],
            'kehadiran' => [
                'hadir' => $hadir,
                'terlambat' => $terlambat,
                'tidakHadir' => 0, 'izin' => 0
            ]
        ]);
    }

   public function updateProfile(Request $request) {
        $user = auth()->user();
        $user->update($request->only(
            'name', 'nip', 'subject', 'phone', 'address',
            'pendidikan', 'golongan', 'status_pegawai', 'tanggal_mulai' 
        ));
        
        return response()->json(['message' => 'Profil dan data pekerjaan diperbarui']);
    }

    public function updateAvatar(Request $request) {
        $path = $request->file('avatar')->store('avatars', 'public');
        $url = asset('storage/' . $path);
        auth()->user()->update(['avatar_url' => $url]);
        return response()->json(['avatar_url' => $url]);
    }

    public function changePassword(Request $request) {
        auth()->user()->update(['password' => Hash::make($request->password)]);
        return response()->json(['message' => 'Password diganti']);
    }

    public function getLeaveRequests()
    {
        $user = auth()->user();
        if (!Schema::hasTable('leave_requests')) return response()->json([]);
        $requests = DB::table('leave_requests')->where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        return response()->json($requests);
    }

    public function storeLeaveRequest(Request $request)
    {
        $request->validate([
            'type' => 'required|in:Izin,Sakit,Cuti',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:500',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120', 
        ]);

        $user = auth()->user();
        $attachmentName = null; $attachmentUrl = null; $attachmentSize = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentSize = number_format($file->getSize() / 1024, 0) . ' KB';
            $path = $file->store('leave_attachments', 'public');
            $attachmentUrl = asset('storage/' . $path);
        }

        DB::table('leave_requests')->insert([
            'user_id' => $user->id, 'type' => $request->type, 'start_date' => $request->start_date,
            'end_date' => $request->end_date, 'reason' => $request->reason, 'status' => 'menunggu', 
            'attachment_name' => $attachmentName, 'attachment_size' => $attachmentSize,
            'attachment_url' => $attachmentUrl, 'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Pengajuan berhasil dikirim']);
    }

    public function adminDashboard()
    {
        try {
            $today = now()->toDateString();
            
            // 1. STATISTIK KARTU
            $totalGuru = DB::table('users')->where('role', 'guru')->count();
            $todayAtts = DB::table('attendances')->whereDate('date', $today)->get();
            
            $stats = [
                'totalGuru' => $totalGuru,
                'hadirHariIni' => $todayAtts->where('status', 'hadir')->count(),
                'tidakHadir' => $todayAtts->whereIn('status', ['tidak_hadir', 'tidak hadir'])->count(),
                'terlambat' => $todayAtts->where('status', 'terlambat')->count(),
                'izin' => $todayAtts->whereIn('status', ['izin', 'sakit', 'cuti'])->count(),
                'tidakValid' => 0,
            ];

            // 2. LINE CHART (7 HARI TERAKHIR)
            $lineData = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i)->toDateString();
                $label = now()->subDays($i)->format('d M');
                $dayAtts = DB::table('attendances')->whereDate('date', $date)->get();
                $lineData[] = [
                    'label' => $label,
                    'hadir' => $dayAtts->where('status', 'hadir')->count(),
                    'terlambat' => $dayAtts->where('status', 'terlambat')->count(),
                    'absen' => $dayAtts->whereIn('status', ['tidak_hadir', 'tidak hadir'])->count(),
                ];
            }

            // 3. RADAR CHART
            $radarData = [];
            $subjects = DB::table('users')
                ->where('role', 'guru')
                ->select('subject', DB::raw('count(*) as total'))
                ->groupBy('subject')
                ->get();

            foreach($subjects as $sub) {
                $hadirCount = DB::table('attendances')
                    ->join('users', 'attendances.user_id', '=', 'users.id')
                    ->where('users.subject', $sub->subject)
                    ->whereDate('attendances.date', $today)
                    ->whereIn('attendances.status', ['hadir', 'terlambat'])
                    ->count();
                
                $radarData[] = [
                    'subject' => $sub->subject ?: 'Lainnya',
                    'alokasi' => $sub->total,
                    'aktual' => $hadirCount
                ];
            }

            $recentAttendances = DB::table('attendances')
                ->join('users', 'attendances.user_id', '=', 'users.id')
                ->whereDate('attendances.date', $today)
                ->select('attendances.*', 'users.name', 'users.subject', 'users.avatar_url')
                ->orderBy('attendances.updated_at', 'desc')
                ->limit(5)->get();

            $activities = DB::table('attendances')
                ->join('users', 'attendances.user_id', '=', 'users.id')
                ->select('users.name', 'attendances.status as action', 'attendances.updated_at as created_at')
                ->orderBy('attendances.updated_at', 'desc')
                ->limit(4)->get();

            return response()->json([
                'stats' => $stats,
                'lineData' => $lineData,
                'radarData' => $radarData,
                'recentAttendances' => $recentAttendances,
                'activities' => $activities
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error Server: ' . $e->getMessage()], 500);
        }
    }
    public function getGurus()
    {
       
        $gurus = DB::table('users')
            ->where('role', 'guru')
            ->select('id', 'name', 'email', 'nip', 'gender', 'subject', 'status', 'phone', 'avatar_url')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($gurus);
    }

    public function storeGuru(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'nip' => 'required|string',
            'subject' => 'required|string',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make('password123'), 
            'role' => 'guru',
            'nip' => $request->nip,
            'gender' => $request->gender,
            'subject' => $request->subject,
            'status' => $request->status ?? 'Aktif',
            'phone' => $request->phone,
        ]);

        return response()->json(['message' => 'Guru berhasil ditambahkan']);
    }

    public function updateGuru(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email,' . $id, 
            'nip' => 'required|string',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'nip' => $request->nip,
            'gender' => $request->gender,
            'subject' => $request->subject,
            'status' => $request->status,
            'phone' => $request->phone,
        ]);

        return response()->json(['message' => 'Data guru berhasil diupdate']);
    }

    public function deleteGuru($id)
    {
        $user = User::findOrFail($id);

        DB::table('attendances')->where('user_id', $id)->delete();
        if(Schema::hasTable('leave_requests')) {
            DB::table('leave_requests')->where('user_id', $id)->delete();
        }
        
        $user->delete();

        return response()->json(['message' => 'Guru berhasil dihapus']);
    }

    public function getAttendances(Request $request)
    {
        $date = $request->query('date', now()->toDateString());
        $gurus = DB::table('users')->where('role', 'guru')->select('id', 'name', 'subject')->get();
        $attendances = DB::table('attendances')->whereDate('date', $date)->get()->keyBy('user_id');  
        $result = [];
        $stats = [
            'total' => $gurus->count(), 
            'hadir' => 0, 
            'tidakHadir' => 0, 
            'terlambat' => 0, 
            'izin' => 0
        ];
        foreach ($gurus as $guru) {
            $att = $attendances->get($guru->id);
            $status = $att ? $att->status : 'tidak_hadir';
            if ($status === 'hadir') $stats['hadir']++;
            elseif ($status === 'terlambat') $stats['terlambat']++;
            elseif (in_array($status, ['izin', 'sakit', 'cuti'])) $stats['izin']++;
            else $stats['tidakHadir']++;

            $result[] = [
                'id' => $att ? $att->id : 'u-'.$guru->id,
                'user_id' => $guru->id,
                'nama_guru' => $guru->name,
                'mata_pelajaran' => $guru->subject,
                'status' => $status,
                'check_in_time' => $att ? $att->check_in_time : null,
                'check_out_time' => $att ? $att->check_out_time : null,
                'check_in_lat' => $att ? $att->check_in_lat : null,
                'check_in_lng' => $att ? $att->check_in_lng : null,
                'check_out_lat' => $att ? $att->check_out_lat : null,
                'check_out_lng' => $att ? $att->check_out_lng : null,
                'distance_check_in' => $att ? $att->distance_check_in : null,
                'distance_check_out' => $att ? $att->distance_check_out : null,
                'check_in_photo' => $att ? $att->check_in_photo : null,
                'check_out_photo' => $att ? $att->check_out_photo : null,
                'is_face_valid' => $att ? $att->is_face_valid : null,
            ];
        }

        return response()->json([
            'data' => $result,
            'stats' => $stats,
            'date' => $date
        ]);
    }
    
    public function getValidations(Request $request)
{
    $date = $request->query('date', now()->toDateString());
    
    // 1. Ambil Radius dari Pengaturan Admin (tabel app_settings atau sejenisnya)
    $settings = DB::table('app_settings')->where('id', 1)->first();
    $radiusSekolah = $settings ? (int)$settings->radius_lokasi : 100; // Default 100 jika database kosong
    
    $attendances = DB::table('attendances')
        ->join('users', 'attendances.user_id', '=', 'users.id')
        ->whereDate('attendances.date', $date)
        ->select('attendances.*', 'users.name as nama_guru', 'users.subject as mapel')
        ->orderBy('attendances.created_at', 'desc')
        ->get();

    $data = [];
    $stats = [
        'perluValidasi' => 0,
        'lokasiTidakValid' => 0,
        'fotoTidakValid' => 0,
        'absenGanda' => 0,
        'sudahDivalidasi' => 0
    ];

    foreach ($attendances as $att) {
        $fotoPath = $att->check_in_photo ?: $att->check_out_photo;
        
        // 2. Gunakan $radiusSekolah yang dinamis dari database (bukan angka 50 lagi)
        $jarak = max((float)$att->distance_check_in, (float)$att->distance_check_out);
        $isLokasiInvalid = $jarak > $radiusSekolah; 

        // 3. Cek Foto (Hasil dari AI Face-api.js di React)
        $isFotoInvalid = ($att->is_face_valid == 0);

        $masalah = [];
        $detailArr = [];

        if ($isLokasiInvalid) {
            $masalah[] = "Lokasi";
            $detailArr[] = "Jarak: " . round($jarak) . "m (Batas: " . $radiusSekolah . "m)";
            if ($att->validation_status === 'Belum divalidasi') $stats['lokasiTidakValid']++;
        }
        
        if ($isFotoInvalid) {
            $masalah[] = "Foto";
            $detailArr[] = "Wajah tidak terdeteksi";
            if ($att->validation_status === 'Belum divalidasi') $stats['fotoTidakValid']++;
        }

        if (empty($masalah)) {
            $jenis_masalah = 'Perlu Verifikasi Rutin';
            $detail = "Pemeriksaan manual oleh admin.";
        } else {
            $jenis_masalah = implode(" & ", $masalah) . " Tidak Valid";
            $detail = implode(", ", $detailArr);
        }

        $val_status = $att->validation_status ?? 'Belum divalidasi';

        if ($val_status === 'Belum divalidasi') {
            $stats['perluValidasi']++;
        } else {
            $stats['sudahDivalidasi']++;
        }

        $data[] = [
            'id' => $att->id,
            'nama_guru' => $att->nama_guru,
            'tanggal' => $att->date,
            'jam' => $att->check_in_time ?: $att->check_out_time,
            'jenis_masalah' => $jenis_masalah,
            'detail' => $detail,
            'bukti' => $fotoPath,
            'status_validasi' => $val_status,
            'mapel' => $att->mapel ?: 'Umum'
        ];
    }

    return response()->json(['data' => $data, 'stats' => $stats]);
}

    public function updateValidation(Request $request, $id)
    {
        $request->validate([
            'status_validasi' => 'required|in:Disetujui,Ditolak'
        ]);
        
        DB::table('attendances')->where('id', $id)->update([
            'validation_status' => $request->status_validasi,
            'updated_at' => now()
        ]);
        
        return response()->json(['message' => 'Status validasi berhasil diupdate']);
    }

    public function adminLaporan(Request $request)
    {
  
        $periode = $request->query('periode', date('Y-m'));
        $parts = explode('-', $periode);
        $year = $parts[0] ?? date('Y');
        $month = $parts[1] ?? date('m');
        $mapel = $request->query('mapel', 'Semua');
        $today = now()->toDateString();

        $userQuery = DB::table('users')->where('role', 'guru');
        if ($mapel !== 'Semua') {
            $userQuery->where('subject', $mapel);
        }
        $gurus = $userQuery->get();
        $guruIds = $gurus->pluck('id')->toArray();
        $totalGuru = count($guruIds);

        $mapelList = DB::table('users')->where('role', 'guru')->whereNotNull('subject')->distinct()->pluck('subject');

        $todayAtts = DB::table('attendances')->whereDate('date', $today)->whereIn('user_id', $guruIds)->get();
        $hadirHariIni = $todayAtts->where('status', 'hadir')->count();
        $terlambatHariIni = $todayAtts->where('status', 'terlambat')->count();
        $izinHariIni = $todayAtts->whereIn('status', ['izin', 'sakit', 'cuti'])->count();
        $tidakHadirHariIni = $totalGuru - ($hadirHariIni + $terlambatHariIni + $izinHariIni);

        $monthAtts = DB::table('attendances')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->whereIn('user_id', $guruIds)
            ->get();
        
        $hariKerja = $monthAtts->pluck('date')->unique()->count();
        if ($hariKerja == 0) $hariKerja = 1; 

        $lineData = [];
        $datesInMonth = $monthAtts->pluck('date')->unique()->sort();
        foreach ($datesInMonth as $date) {
            $dayAtts = $monthAtts->where('date', $date);
            $h = $dayAtts->where('status', 'hadir')->count();
            $t = $dayAtts->where('status', 'terlambat')->count();
            $i = $dayAtts->whereIn('status', ['izin', 'sakit', 'cuti'])->count();
            $a = $totalGuru - ($h + $t + $i);
            
            $lineData[] = [
                'label' => date('d', strtotime($date)), 
                'hadir' => $h,
                'terlambat' => $t,
                'absen' => max($a, 0)
            ];
        }

        $totalHadirBulan = $monthAtts->where('status', 'hadir')->count();
        $totalTerlambatBulan = $monthAtts->where('status', 'terlambat')->count();
        $totalIzinBulan = $monthAtts->whereIn('status', ['izin', 'sakit', 'cuti'])->count();
        $totalAbsenBulan = ($totalGuru * $hariKerja) - ($totalHadirBulan + $totalTerlambatBulan + $totalIzinBulan);
        
        $tingkatKehadiran = ($totalGuru * $hariKerja) > 0 
            ? round((($totalHadirBulan + $totalTerlambatBulan) / ($totalGuru * $hariKerja)) * 100, 1) 
            : 0;

        $rekapData = [];
        foreach ($gurus as $guru) {
            $guruAtts = $monthAtts->where('user_id', $guru->id);
            $h = $guruAtts->where('status', 'hadir')->count();
            $t = $guruAtts->where('status', 'terlambat')->count();
            $i = $guruAtts->whereIn('status', ['izin', 'sakit', 'cuti'])->count();
            $a = $hariKerja - ($h + $t + $i);
            
            $persen = round((($h + $t) / $hariKerja) * 100);

            $rekapData[] = [
                'id' => $guru->id,
                'nama' => $guru->name,
                'hadirStr' => $h,
                'terlambat' => $t,
                'tidakHadir' => max($a, 0),
                'izin' => $i,
                'persentase' => $persen . '%',
                'color' => $persen >= 80 ? 'text-[#22c55e]' : ($persen >= 60 ? 'text-[#eab308]' : 'text-[#ef4444]')
            ];
        }

        return response()->json([
            'stats' => [
                'totalGuru' => $totalGuru,
                'hadirHariIni' => $hadirHariIni,
                'tidakHadir' => max($tidakHadirHariIni, 0),
                'terlambat' => $terlambatHariIni,
                'izin' => $izinHariIni,
                'tingkatKehadiran' => $tingkatKehadiran . '%'
            ],
            'lineData' => empty($lineData) ? [['label' => '-', 'hadir' => 0, 'terlambat' => 0, 'absen' => 0]] : $lineData,
            'donutData' => [
                'total' => max($totalGuru * $hariKerja, 1), // Hindari 0
                'hadir' => $totalHadirBulan,
                'terlambat' => $totalTerlambatBulan,
                'tidakHadir' => max($totalAbsenBulan, 0),
                'izin' => $totalIzinBulan
            ],
            'summary' => [
                'totalGuru' => $totalGuru,
                'hariKerja' => $hariKerja,
                'rataKehadiran' => $tingkatKehadiran . '%'
            ],
            'rekapData' => collect($rekapData)->sortByDesc('persentase')->values(),
            'mapelList' => $mapelList
        ]);
    }

    public function getSettings()
    {
        $settings = DB::table('app_settings')->where('id', 1)->first();
        return response()->json($settings ?: []);
    }

    public function updateSettings(Request $request)
    {
        $data = $request->except(['id', 'created_at', 'updated_at']);
        
        foreach (['absen_ganda', 'foto_selfie', 'validasi_lokasi', 'mode_pemeliharaan', 'notif_email', 'notif_push', 'notif_keterlambatan', 'notif_pengajuan'] as $boolField) {
            if (isset($data[$boolField])) {
                $data[$boolField] = filter_var($data[$boolField], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }
        }

        $data['updated_at'] = now();

        DB::table('app_settings')->updateOrInsert(['id' => 1], $data);

        return response()->json(['message' => 'Pengaturan berhasil disimpan']);
    }
    public function getAdminLeaveRequests()
    {
        // Gabungkan tabel leave_requests dengan tabel users untuk mendapat nama, nip, foto profil
        $requests = DB::table('leave_requests')
            ->join('users', 'leave_requests.user_id', '=', 'users.id')
            ->select(
                'leave_requests.*',
                'users.name',
                'users.nip',
                'users.avatar_url',
                'users.subject'
            )
            ->orderBy('leave_requests.created_at', 'desc')
            ->get();

        return response()->json($requests);
    }

    public function updateAdminLeaveRequest(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Disetujui,Ditolak,Menunggu,Dibatalkan',
            'catatan' => 'nullable|string'
        ]);

        DB::table('leave_requests')->where('id', $id)->update([
            'status' => $request->status,
            'catatan' => $request->catatan,
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Status dan catatan berhasil diupdate']);
    }
    public function getUsers()
    {
        $users = DB::table('users')
            ->select('id', 'name', 'username', 'email', 'role', 'status', 'last_login')
            ->orderBy('created_at', 'desc')
            ->get();
          
        return response()->json($users);
    }

    public function storeUser(Request $request)
    {
        $request->validate([
            'nama' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|string',
        ]);

        User::create([
            'name' => $request->nama,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make('password123'), // Default Password
            'role' => strtolower($request->role),
            'status' => $request->status ?? 'Aktif',
        ]);
        return response()->json(['message' => 'Pengguna berhasil ditambahkan']);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $request->validate([
            'nama' => 'required|string',
            'email' => 'required|email|unique:users,email,' . $id,
        ]);

        $user->update([
            'name' => $request->nama,
            'username' => $request->username,
            'email' => $request->email,
            'role' => strtolower($request->role),
            'status' => $request->status,
        ]);
        return response()->json(['message' => 'Data pengguna berhasil diupdate']);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        DB::table('attendances')->where('user_id', $id)->delete();
        if(Schema::hasTable('leave_requests')) {
            DB::table('leave_requests')->where('user_id', $id)->delete();
        }
        
        $user->delete();
        return response()->json(['message' => 'Pengguna berhasil dihapus']);
    }
    public function getAdminProfile(Request $request)
    {
        $user = auth()->user();
        $agent = $request->userAgent();
        $browser = 'Browser Lain';
        if (strpos($agent, 'Chrome') !== false) $browser = 'Google Chrome';
        elseif (strpos($agent, 'Firefox') !== false) $browser = 'Mozilla Firefox';
        elseif (strpos($agent, 'Safari') !== false) $browser = 'Safari';
        elseif (strpos($agent, 'Edge') !== false) $browser = 'Microsoft Edge';

        $os = 'Perangkat Lain';
        if (strpos($agent, 'Windows') !== false) $os = 'Windows';
        elseif (strpos($agent, 'Mac') !== false) $os = 'Mac OS';
        elseif (strpos($agent, 'Linux') !== false) $os = 'Linux';
        elseif (strpos($agent, 'Android') !== false) $os = 'Android';
        elseif (strpos($agent, 'iPhone') !== false) $os = 'iOS';
        $settings = DB::table('app_settings')->where('id', 1)->first();
        $tz = $settings ? $settings->zona_waktu : 'Asia/Jakarta';
        $lastLoginFormatted = $user->last_login ? \Carbon\Carbon::parse($user->last_login)->timezone($tz)->translatedFormat('d M Y H:i') . ' WIB' : 'Belum Pernah';

     
        $session = [
            'lastLogin' => $lastLoginFormatted,
            'ip' => $request->ip() === '127.0.0.1' ? 'Localhost (127.0.0.1)' : $request->ip(),
            'browser' => $browser,
            'device' => $os,
            'status' => 'Aktif'
        ];


        $activities = [
            ['text' => 'Login ke sistem', 'time' => $lastLoginFormatted, 'type' => 'login'],
            ['text' => 'Pembaruan profil terakhir', 'time' => \Carbon\Carbon::parse($user->updated_at)->timezone($tz)->translatedFormat('d M Y H:i') . ' WIB', 'type' => 'manage']
        ];

        return response()->json([
            'profile' => [
                'nama' => $user->name,
                'nip' => $user->username ?: $user->nip ?: '-',
                'email' => $user->email,
                'phone' => $user->phone ?: '-',
                'jabatan' => ucfirst($user->role),
                'instansi' => $user->instansi ?: 'Dinas Pendidikan',
                'alamat' => $user->address ?: '-',
                'avatar_url' => $user->avatar_url
            ],
            'session' => $session,
            'activities' => $activities
        ]);
    }

    public function updateAdminProfile(Request $request)
    {
        $request->validate([
            'nama' => 'required|string',
            'email' => 'required|email|unique:users,email,' . auth()->id()
        ]);

        $user = auth()->user();
        $user->update([
            'name' => $request->nama,
            'username' => $request->nip,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->alamat,
            'instansi' => $request->instansi,
            'updated_at' => now()
        ]);

        if ($request->has('instansi')) {
        \Illuminate\Support\Facades\DB::table('app_settings')->updateOrInsert(
            ['id' => 1], 
            ['nama_instansi' => $request->instansi]
        );
    }

        return response()->json(['message' => 'Profil berhasil diperbarui']);
    }
    public function getNotifications()
    {
        try {
            $user = auth()->user();
            $notifs = [];
            $unreadCount = 0;
            $notifId = 1;
            
            // Ambil waktu terakhir kali user buka lonceng
            $lastCheck = $user->last_notif_check ?? '2000-01-01 00:00:00';

            if ($user->role === 'admin') {
                // --- LOGIKA ADMIN (Sama seperti sebelumnya) ---
                $perluValidasi = \Illuminate\Support\Facades\DB::table('attendances')->where('validation_status', 'Belum divalidasi')->count();
                if ($perluValidasi > 0) {
                    $notifs[] = ['id' => $notifId++, 'title' => 'Validasi Absensi', 'message' => "Ada $perluValidasi absensi menunggu validasi.", 'time' => 'Sistem', 'is_read' => false];
                    $unreadCount++;
                }
                
                $cutiBaru = \Illuminate\Support\Facades\DB::table('leave_requests')->whereIn('status', ['menunggu', 'Menunggu'])->count();
                if ($cutiBaru > 0) {
                    $notifs[] = ['id' => $notifId++, 'title' => 'Pengajuan Izin/Cuti', 'message' => "Ada $cutiBaru pengajuan izin baru.", 'time' => 'Sistem', 'is_read' => false];
                    $unreadCount++;
                }
            } else {
                // --- LOGIKA GURU (DIPERBAIKI) ---
                
                // 1. Cek update Izin/Cuti
                $cutiUpdates = \Illuminate\Support\Facades\DB::table('leave_requests')
                    ->where('user_id', $user->id)
                    ->whereIn('status', ['Disetujui', 'Ditolak', 'disetujui', 'ditolak'])
                    ->orderBy('updated_at', 'desc')
                    ->take(3)
                    ->get();

                foreach ($cutiUpdates as $c) {
                    // Jika updated_at lebih baru dari last_notif_check, maka ini "Belum Dibaca"
                    $isNew = $c->updated_at > $lastCheck;
                    $notifs[] = [
                        'id' => $notifId++,
                        'title' => 'Update Izin/Cuti',
                        'message' => "Pengajuan " . ($c->type ?? 'Izin') . " Anda telah " . strtoupper($c->status),
                        'time' => date('d M H:i', strtotime($c->updated_at)),
                        'is_read' => !$isNew
                    ];
                    if ($isNew) $unreadCount++;
                }

                // 2. Cek update Validasi Absen
                $absenUpdates = \Illuminate\Support\Facades\DB::table('attendances')
                    ->where('user_id', $user->id)
                    ->where('validation_status', '!=', 'Belum divalidasi')
                    ->orderBy('updated_at', 'desc')
                    ->take(3)
                    ->get();

                foreach ($absenUpdates as $a) {
                    $isNew = $a->updated_at > $lastCheck;
                    $notifs[] = [
                        'id' => $notifId++,
                        'title' => 'Update Absensi',
                        'message' => "Absen tgl " . date('d/m/Y', strtotime($a->date)) . " status: " . $a->validation_status,
                        'time' => date('d M H:i', strtotime($a->updated_at)),
                        'is_read' => !$isNew
                    ];
                    if ($isNew) $unreadCount++;
                }
            }

            if (empty($notifs)) {
                $notifs[] = ['id' => 0, 'title' => 'Sistem SIMPEG', 'message' => 'Belum ada notifikasi.', 'time' => '-', 'is_read' => true];
            }

            return response()->json([
                'data' => $notifs,
                'unread_count' => $unreadCount
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['data' => [], 'unread_count' => 0], 500);
        }
    }
    public function markNotificationsRead()
{
    try {
        $user = auth()->user();
        \Illuminate\Support\Facades\DB::table('users')
            ->where('id', $user->id)
            ->update(['last_notif_check' => now()]);

        return response()->json(['message' => 'Berhasil ditandai sudah dibaca']);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
}