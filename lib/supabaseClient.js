// File ini kita "palsukan" sementara agar aplikasi jalan tanpa database
export const supabase = {
  from: (table) => ({
    select: () => ({
      eq: () => ({
        single: () => ({ data: { id: 1, nama: 'User Ganteng', peran: 'superadmin' }, error: null }),
        order: () => ({ data: [], error: null })
      }),
      order: () => ({ data: [], error: null })
    }),
    insert: () => ({ error: null }),
    update: () => ({ eq: () => ({ error: null }) }),
    delete: () => ({ eq: () => ({ error: null }) })
  })
};