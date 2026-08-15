import emailjs from '@emailjs/browser';
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

export const sendProjectAssignmentEmail = async (
  email: string,
  username: string,
  projectName: string,
  role: string
) => {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    console.warn('EmailJS is not configured. Please add your credentials to emailService.ts');
    console.log(`[Mock Email] To: ${email} | Subject: Assigned to ${projectName} as ${role}`);
    return;
  }

  try {
    const templateParams = {
      to_name: username,
      to_email: email,
      project_name: projectName,
      assigned_role: role,
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Email successfully sent!', response.status, response.text);
  } catch (error) {
    console.error('Failed to send assignment email:', error);
  }
};

export const sendSubtaskAssignmentEmail = async (
  email: string,
  username: string,
  taskTitle: string,
  subtaskTitle: string,
  dueDate: string,
  estHours: number
) => {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    console.warn('EmailJS is not configured. Please add your credentials to emailService.ts');
    console.log(`[Mock Email] To: ${email} | Subject: New Subtask Assigned: ${subtaskTitle} (Task: ${taskTitle}) | Due: ${dueDate} | Hours: ${estHours}`);
    return;
  }

  try {
    const templateParams = {
      name: username, // {{name}} from template
      time: dueDate, // {{time}} from template
      message: `You have been assigned a new subtask: "${subtaskTitle}" for the main task "${taskTitle}". Estimated hours: ${estHours} hrs.`, // {{message}} from template
      email: email, // {{email}} from template
      to_name: username, // Fallbacks just in case
      to_email: email, 
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Subtask Email successfully sent!', response.status, response.text);
  } catch (error) {
    console.error('Failed to send subtask email:', error);
  }
};
