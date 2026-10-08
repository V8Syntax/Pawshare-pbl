import CheckIn from '../models/CheckIn.js';

const SCHEDULE = { adopt: [7, 30, 90], foster: [7, 14, 30] }; // days after placement

export async function scheduleCheckIns(application) {
  const day = 24 * 60 * 60 * 1000;
  const docs = SCHEDULE[application.type].map((d) => ({
    application: application._id,
    animal: application.animal,
    adopter: application.applicant,
    owner: application.owner,
    dueDate: new Date(Date.now() + d * day),
  }));
  await CheckIn.insertMany(docs);
}
