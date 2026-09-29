import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
let pending = [], scheduled = [], granted = true, native = true;
mock.module('@capacitor/core', { namedExports: { Capacitor: { isNativePlatform: () => native } } });
mock.module('@capacitor/local-notifications', { namedExports: { LocalNotifications: {
  requestPermissions: async () => ({display: granted ? 'granted' : 'denied'}),
  checkPermissions: async () => ({display: granted ? 'granted' : 'denied'}),
  getPending: async () => ({notifications: pending}),
  cancel: async ({notifications}) => { pending = pending.filter(p => !notifications.some(n => n.id === p.id)); },
  schedule: async ({notifications}) => { scheduled = notifications; pending.push(...notifications); },
} } });
const {reminderCandidates, taskRemindersService: service} = await import('../src/services/task-reminders.service.ts');
const task = (id, minutes, status='TODO') => ({id, title:id, status, startAt:new Date(Date.now()+minutes*60000).toISOString(), reminderMinutes:15});
test('filters completed, past, invalid dates and distant tasks; orders reminders', () => {
  const tasks=[task('later',90), task('past',5),task('done',60,'DONE'),task('first',30),task('distant',31*24*60),{...task('bad',40),startAt:'invalid'}];
  assert.deepEqual(reminderCandidates(tasks).map(x=>x.task.id),['first','later']);
});
test('reschedules edits, cancels deleted/completed tasks and preserves unrelated reminders', async () => {
  pending=[{id:42,extra:{kind:'other'}}];
  await service.sync('u1',[task('a',30),task('b',60)],()=>true);
  assert.equal(scheduled.length,2); assert.equal(pending.length,3);
  await service.sync('u1',[task('a',90),task('b',60,'DONE')],()=>true);
  assert.equal(scheduled.length,1);assert.equal(scheduled[0].extra.taskId,'a');assert.equal(pending.length,2);
  await service.cancel();assert.deepEqual(pending,[{id:42,extra:{kind:'other'}}]);
});
test('capacity is bounded and stale account work never schedules',async()=>{
  pending=[];scheduled=[];
  await service.sync('u1',Array.from({length:80},(_,i)=>task(String(i),30+i)),()=>true);
  assert.equal(scheduled.length,60);
  await service.cancel();scheduled=[];
  await service.sync('old-user',[task('a',30)],()=>false);assert.equal(scheduled.length,0);
});
test('permission denial and web limitations are explicit',async()=>{
  granted=false;await assert.rejects(service.enablePermission());await assert.rejects(service.sync('u1',[task('a',30)],()=>true));
  granted=true;native=false;await assert.rejects(service.enablePermission());
});
