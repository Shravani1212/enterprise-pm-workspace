import Swal from 'sweetalert2';

export const showSuccessAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 2000,
    showConfirmButton: false,
    customClass: {
      popup: 'rounded-2xl border border-slate-200 shadow-xl',
      title: 'text-lg font-bold text-slate-800',
    },
  });
};

export const showErrorAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#4f46e5',
    customClass: {
      popup: 'rounded-2xl border border-slate-200 shadow-xl',
      title: 'text-lg font-bold text-slate-800',
      confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md',
    },
  });
};

export const showWarningAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#f59e0b',
    customClass: {
      popup: 'rounded-2xl border border-slate-200 shadow-xl',
      title: 'text-lg font-bold text-slate-800',
      confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md',
    },
  });
};

export const showConfirmAlert = async (
  title: string,
  text: string,
  confirmButtonText = 'Yes, proceed'
): Promise<boolean> => {
  const result = await Swal.fire({
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#94a3b8',
    customClass: {
      popup: 'rounded-2xl border border-slate-200 shadow-xl',
      title: 'text-lg font-bold text-slate-800',
      confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md',
      cancelButton: 'px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md',
    },
  });

  return result.isConfirmed;
};
