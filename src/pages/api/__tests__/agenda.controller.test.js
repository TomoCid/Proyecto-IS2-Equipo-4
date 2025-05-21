import * as agendaController from '../weather/[ciudad].js'; 
import * as agendaModel from '@/app/agenda/consultas-agenda.js'; 

jest.mock('@/app/agenda/consultas-agenda.js');


const mockRequest = (params = {}, body = {}, user = null) => {
  const req = {};
  req.params = params;
  req.body = body;
  if (user) {
    req.user = user;
  }
  return req;
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res); 
  res.json = jest.fn().mockReturnValue(res);   
  res.send = jest.fn().mockReturnValue(res);   
  return res;
};

// --- Global Test Variables ---
let req;
let res;

// --- Test Suite ---
describe('Agenda Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
     console.error.mockRestore();
  });

  // --- Tests for handleGetUserAgenda ---
  describe('handleGetUserAgenda', () => {
    it('should return 200 and the user agenda on success', async () => {
      const userId = 1;
      const mockAgenda = [{ id: 1, fecha: '2023-10-27' }, { id: 2, fecha: '2023-10-28' }];
      req = mockRequest({ userId: String(userId) });
      agendaModel.getUserAgenda.mockResolvedValue(mockAgenda); 

      await agendaController.handleGetUserAgenda(req, res);

      expect(agendaModel.getUserAgenda).toHaveBeenCalledTimes(1);
      expect(agendaModel.getUserAgenda).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAgenda);
    });

    it('should return 400 if userId is not a valid number', async () => {
      req = mockRequest({ userId: 'abc' });

      await agendaController.handleGetUserAgenda(req, res);

      expect(agendaModel.getUserAgenda).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User ID inválido.' });
    });

    it('should return 500 if the model throws an error', async () => {
      const userId = 1;
      const errorMessage = 'Database error';
      req = mockRequest({ userId: String(userId) });
      agendaModel.getUserAgenda.mockRejectedValue(new Error(errorMessage)); 

      await agendaController.handleGetUserAgenda(req, res);

      expect(agendaModel.getUserAgenda).toHaveBeenCalledTimes(1);
      expect(agendaModel.getUserAgenda).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener la agenda del usuario.' });
      expect(console.error).toHaveBeenCalled();
    });
  });

  // --- Tests for handleCreateAgendaEntry ---
  describe('handleCreateAgendaEntry', () => {
    const userId = 5;
    const validEntryData = {
      activityId: 10,
      fecha: '2023-11-15',
      horaInicio: '09:00:00',
      horaFin: '10:00:00',
      notes: 'Test entry',
    };
    const createdEntry = { ...validEntryData, id: 101, user_id: userId };

    it('should return 201 and the created entry on success with no conflicts', async () => {
      req = mockRequest({ userId: String(userId) }, validEntryData);
      agendaModel.findScheduleConflicts.mockResolvedValue([]); // No conflicts
      agendaModel.createAgendaEntry.mockResolvedValue(createdEntry);

      await agendaController.handleCreateAgendaEntry(req, res);

      expect(agendaModel.findScheduleConflicts).toHaveBeenCalledTimes(1);
      expect(agendaModel.findScheduleConflicts).toHaveBeenCalledWith(
        userId,
        validEntryData.fecha,
        validEntryData.horaInicio,
        validEntryData.horaFin
      );
      expect(agendaModel.createAgendaEntry).toHaveBeenCalledTimes(1);
      expect(agendaModel.createAgendaEntry).toHaveBeenCalledWith(
         expect.objectContaining({ ...validEntryData, userId: userId })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdEntry);
    });

    it('should return 400 if userId is invalid', async () => {
       req = mockRequest({ userId: 'invalid' }, validEntryData);

      await agendaController.handleCreateAgendaEntry(req, res);

      expect(agendaModel.findScheduleConflicts).not.toHaveBeenCalled();
      expect(agendaModel.createAgendaEntry).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User ID inválido.' });
    });

     it('should return 400 if required fields are missing', async () => {
       const incompleteData = { activityId: 10, fecha: '2023-11-15' };
       req = mockRequest({ userId: String(userId) }, incompleteData);

      await agendaController.handleCreateAgendaEntry(req, res);

      expect(agendaModel.findScheduleConflicts).not.toHaveBeenCalled();
      expect(agendaModel.createAgendaEntry).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Faltan campos requeridos (activityId, fecha, horaInicio, horaFin).' });
    });

    it('should return 409 if schedule conflicts are found', async () => {
       const conflicts = [{ id: 50, fecha: '2023-11-15', horaInicio: '09:30:00' }];
       req = mockRequest({ userId: String(userId) }, validEntryData);
       agendaModel.findScheduleConflicts.mockResolvedValue(conflicts); 

      await agendaController.handleCreateAgendaEntry(req, res);

      expect(agendaModel.findScheduleConflicts).toHaveBeenCalledTimes(1);
      expect(agendaModel.createAgendaEntry).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Conflicto de horario detectado con entradas existentes.',
        conflicts: conflicts
      });
    });

    it('should return 400 if activityId does not exist (foreign key constraint)', async () => {
      req = mockRequest({ userId: String(userId) }, validEntryData);
      agendaModel.findScheduleConflicts.mockResolvedValue([]);
      agendaModel.createAgendaEntry.mockRejectedValue(new Error('violates foreign key constraint "fk_activity"'));

      await agendaController.handleCreateAgendaEntry(req, res);

      expect(agendaModel.findScheduleConflicts).toHaveBeenCalledTimes(1);
      expect(agendaModel.createAgendaEntry).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'La actividad especificada no existe.' });
      expect(console.error).toHaveBeenCalled();
    });

    it('should return 500 if findScheduleConflicts throws an error', async () => {
      req = mockRequest({ userId: String(userId) }, validEntryData);
      agendaModel.findScheduleConflicts.mockRejectedValue(new Error('DB error'));

      await agendaController.handleCreateAgendaEntry(req, res);

      expect(agendaModel.findScheduleConflicts).toHaveBeenCalledTimes(1);
      expect(agendaModel.createAgendaEntry).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al crear la entrada de agenda.' });
      expect(console.error).toHaveBeenCalled();
    });

    it('should return 500 if createAgendaEntry throws a generic error', async () => {
        req = mockRequest({ userId: String(userId) }, validEntryData);
        agendaModel.findScheduleConflicts.mockResolvedValue([]);
        agendaModel.createAgendaEntry.mockRejectedValue(new Error('Some other DB error'));

        await agendaController.handleCreateAgendaEntry(req, res);

        expect(agendaModel.findScheduleConflicts).toHaveBeenCalledTimes(1);
        expect(agendaModel.createAgendaEntry).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Error al crear la entrada de agenda.' });
        expect(console.error).toHaveBeenCalled();
    });
  });

  // --- Tests for handleUpdateAgendaEntry ---
  describe('handleUpdateAgendaEntry', () => {
      const agendaId = 55;
      const userId = 7; 
      const updateData = { notes: 'Updated note', reminderEnabled: true };
      const updateDataWithTime = {
          ...updateData,
          fecha: '2023-12-01',
          horaInicio: '14:00:00',
          horaFin: '15:00:00',
      };
      const updatedEntry = { id: agendaId, user_id: userId, ...updateData };
      const updatedEntryWithTime = { id: agendaId, user_id: userId, ...updateDataWithTime };

      it('should return 200 and the updated entry (no time conflict check needed)', async () => {
          req = mockRequest({ agendaId: String(agendaId) }, updateData, { id: userId });
          agendaModel.updateAgendaEntry.mockResolvedValue(updatedEntry);

          await agendaController.handleUpdateAgendaEntry(req, res);

          expect(agendaModel.findScheduleConflicts).not.toHaveBeenCalled();
          expect(agendaModel.updateAgendaEntry).toHaveBeenCalledTimes(1);
          expect(agendaModel.updateAgendaEntry).toHaveBeenCalledWith(agendaId, userId, updateData);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(updatedEntry);
      });

      it('should return 200 and updated entry after checking for conflicts (no conflicts found)', async () => {
          req = mockRequest({ agendaId: String(agendaId) }, updateDataWithTime, { id: userId });
          agendaModel.findScheduleConflicts.mockResolvedValue([]); // No conflicts
          agendaModel.updateAgendaEntry.mockResolvedValue(updatedEntryWithTime);

          await agendaController.handleUpdateAgendaEntry(req, res);

          expect(agendaModel.findScheduleConflicts).toHaveBeenCalledTimes(1);
          expect(agendaModel.findScheduleConflicts).toHaveBeenCalledWith(
              userId,
              updateDataWithTime.fecha,
              updateDataWithTime.horaInicio,
              updateDataWithTime.horaFin,
              agendaId 
          );
          expect(agendaModel.updateAgendaEntry).toHaveBeenCalledTimes(1);
          expect(agendaModel.updateAgendaEntry).toHaveBeenCalledWith(agendaId, userId, updateDataWithTime);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(updatedEntryWithTime);
      });

      it('should return 400 if agendaId is invalid', async () => {
         req = mockRequest({ agendaId: 'invalid' }, updateData, { id: userId });

         await agendaController.handleUpdateAgendaEntry(req, res);

         expect(agendaModel.findScheduleConflicts).not.toHaveBeenCalled();
         expect(agendaModel.updateAgendaEntry).not.toHaveBeenCalled();
         expect(res.status).toHaveBeenCalledWith(400);
         expect(res.json).toHaveBeenCalledWith({ error: 'Agenda ID inválido.' });
      });

      it('should return 400 if updateData is empty', async () => {
          req = mockRequest({ agendaId: String(agendaId) }, {}, { id: userId });

         await agendaController.handleUpdateAgendaEntry(req, res);

         expect(agendaModel.findScheduleConflicts).not.toHaveBeenCalled();
         expect(agendaModel.updateAgendaEntry).not.toHaveBeenCalled();
         expect(res.status).toHaveBeenCalledWith(400);
         expect(res.json).toHaveBeenCalledWith({ error: 'No se proporcionaron campos para actualizar.' });
      });

      it('should return 409 if conflicts are found during update', async () => {
         const conflicts = [{ id: 60, fecha: '2023-12-01', horaInicio: '14:30:00' }];
         req = mockRequest({ agendaId: String(agendaId) }, updateDataWithTime, { id: userId });
         agendaModel.findScheduleConflicts.mockResolvedValue(conflicts); 

         await agendaController.handleUpdateAgendaEntry(req, res);

         expect(agendaModel.findScheduleConflicts).toHaveBeenCalledTimes(1);
         expect(agendaModel.updateAgendaEntry).not.toHaveBeenCalled();
         expect(res.status).toHaveBeenCalledWith(409);
         expect(res.json).toHaveBeenCalledWith({
            error: 'Conflicto de horario detectado con otras entradas al actualizar.',
            conflicts: conflicts
         });
      });

       it('should return 404 if model throws "not found or user does not have permission"', async () => {
          req = mockRequest({ agendaId: String(agendaId) }, updateData, { id: userId });
          agendaModel.updateAgendaEntry.mockRejectedValue(new Error('Agenda entry not found or user does not have permission'));

          await agendaController.handleUpdateAgendaEntry(req, res);

          expect(agendaModel.findScheduleConflicts).not.toHaveBeenCalled(); 
          expect(agendaModel.updateAgendaEntry).toHaveBeenCalledTimes(1);
          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({ error: 'Entrada no encontrada o sin permiso para actualizar.' });
          expect(console.error).toHaveBeenCalled();
       });

      it('should return 500 if findScheduleConflicts throws an error', async () => {
          req = mockRequest({ agendaId: String(agendaId) }, updateDataWithTime, { id: userId });
          agendaModel.findScheduleConflicts.mockRejectedValue(new Error('DB error during conflict check'));

          await agendaController.handleUpdateAgendaEntry(req, res);

          expect(agendaModel.findScheduleConflicts).toHaveBeenCalledTimes(1);
          expect(agendaModel.updateAgendaEntry).not.toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({ error: 'Error al actualizar la entrada de agenda.' });
          expect(console.error).toHaveBeenCalled();
      });

       it('should return 500 if updateAgendaEntry throws a generic error', async () => {
          req = mockRequest({ agendaId: String(agendaId) }, updateData, { id: userId });
          agendaModel.updateAgendaEntry.mockRejectedValue(new Error('Generic update error'));

          await agendaController.handleUpdateAgendaEntry(req, res);

          expect(agendaModel.updateAgendaEntry).toHaveBeenCalledTimes(1);
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({ error: 'Error al actualizar la entrada de agenda.' });
          expect(console.error).toHaveBeenCalled();
       });
  });

  // --- Tests for handleDeleteAgendaEntry ---
  describe('handleDeleteAgendaEntry', () => {
      const agendaId = 99;
      const userId = 11;

      it('should return 204 on successful deletion', async () => {
          req = mockRequest({ agendaId: String(agendaId) }, {}, { id: userId });
          agendaModel.deleteAgendaEntry.mockResolvedValue(true); 

          await agendaController.handleDeleteAgendaEntry(req, res);

          expect(agendaModel.deleteAgendaEntry).toHaveBeenCalledTimes(1);
          expect(agendaModel.deleteAgendaEntry).toHaveBeenCalledWith(agendaId, userId);
          expect(res.status).toHaveBeenCalledWith(204);
          expect(res.send).toHaveBeenCalledTimes(1);
          expect(res.json).not.toHaveBeenCalled();
      });

       it('should return 400 if agendaId is invalid', async () => {
         req = mockRequest({ agendaId: 'badId' }, {}, { id: userId });

         await agendaController.handleDeleteAgendaEntry(req, res);

         expect(agendaModel.deleteAgendaEntry).not.toHaveBeenCalled();
         expect(res.status).toHaveBeenCalledWith(400);
         expect(res.json).toHaveBeenCalledWith({ error: 'Agenda ID inválido.' });
       });

       it('should return 404 if entry is not found or user has no permission', async () => {
          req = mockRequest({ agendaId: String(agendaId) }, {}, { id: userId });
          agendaModel.deleteAgendaEntry.mockResolvedValue(false); 

          await agendaController.handleDeleteAgendaEntry(req, res);

          expect(agendaModel.deleteAgendaEntry).toHaveBeenCalledTimes(1);
          expect(agendaModel.deleteAgendaEntry).toHaveBeenCalledWith(agendaId, userId);
          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({ error: 'Entrada no encontrada o sin permiso para eliminar.' });
       });

       it('should return 500 if model throws an error', async () => {
          req = mockRequest({ agendaId: String(agendaId) }, {}, { id: userId });
          agendaModel.deleteAgendaEntry.mockRejectedValue(new Error('Deletion failed'));

          await agendaController.handleDeleteAgendaEntry(req, res);

          expect(agendaModel.deleteAgendaEntry).toHaveBeenCalledTimes(1);
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({ error: 'Error al eliminar la entrada de agenda.' });
          expect(console.error).toHaveBeenCalled();
       });
  });

  // --- Tests for handleGetActiveUserActivities ---
  describe('handleGetActiveUserActivities', () => {
    const userId = 15;
    const mockActivities = [{ id: 1, name: 'Running' }, { id: 3, name: 'Cycling' }];

    it('should return 200 and the active activities on success', async () => {
        req = mockRequest({ userId: String(userId) });
        agendaModel.getActiveUserActivitiesWithPrefs.mockResolvedValue(mockActivities);

        await agendaController.handleGetActiveUserActivities(req, res);

        expect(agendaModel.getActiveUserActivitiesWithPrefs).toHaveBeenCalledTimes(1);
        expect(agendaModel.getActiveUserActivitiesWithPrefs).toHaveBeenCalledWith(userId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockActivities);
    });

     it('should return 400 if userId is invalid', async () => {
        req = mockRequest({ userId: 'NaN' });

        await agendaController.handleGetActiveUserActivities(req, res);

        expect(agendaModel.getActiveUserActivitiesWithPrefs).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'User ID inválido.' });
     });

     it('should return 500 if model throws an error', async () => {
        req = mockRequest({ userId: String(userId) });
        agendaModel.getActiveUserActivitiesWithPrefs.mockRejectedValue(new Error('DB error'));

        await agendaController.handleGetActiveUserActivities(req, res);

        expect(agendaModel.getActiveUserActivitiesWithPrefs).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener las actividades activas del usuario.' });
        expect(console.error).toHaveBeenCalled();
     });
  });

   // --- Tests for handleGetUserAgendaWithWeather ---
   describe('handleGetUserAgendaWithWeather', () => {
      const userId = 20;
      const mockAgendaWithWeather = [{ id: 1, fecha: '2023-10-27', min_temp: 10 }, { id: 2, fecha: '2023-10-28', max_temp: 25 }];

      it('should return 200 and the user agenda with weather prefs on success', async () => {
          req = mockRequest({ userId: String(userId) });
          agendaModel.getUserAgendaWithWeatherPrefs.mockResolvedValue(mockAgendaWithWeather);

          await agendaController.handleGetUserAgendaWithWeather(req, res);

          expect(agendaModel.getUserAgendaWithWeatherPrefs).toHaveBeenCalledTimes(1);
          expect(agendaModel.getUserAgendaWithWeatherPrefs).toHaveBeenCalledWith(userId);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(mockAgendaWithWeather);
      });

      it('should return 400 if userId is invalid', async () => {
          req = mockRequest({ userId: 'invalidId' });

          await agendaController.handleGetUserAgendaWithWeather(req, res);

          expect(agendaModel.getUserAgendaWithWeatherPrefs).not.toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({ error: 'User ID inválido.' });
      });

      it('should return 500 if model throws an error', async () => {
          req = mockRequest({ userId: String(userId) });
          agendaModel.getUserAgendaWithWeatherPrefs.mockRejectedValue(new Error('Failed to get weather prefs'));

          await agendaController.handleGetUserAgendaWithWeather(req, res);

          expect(agendaModel.getUserAgendaWithWeatherPrefs).toHaveBeenCalledTimes(1);
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener la agenda con preferencias meteorológicas.' });
          expect(console.error).toHaveBeenCalled();
      });
   });

   // --- Tests for handleGetRecurringEntries ---
    describe('handleGetRecurringEntries', () => {
        const userId = 25;
        const mockRecurring = [{ id: 5, periodicidad: 7 }, { id: 8, periodicidad: 30 }];

        it('should return 200 and recurring entries on success', async () => {
            req = mockRequest({ userId: String(userId) });
            agendaModel.getRecurringAgendaEntries.mockResolvedValue(mockRecurring);

            await agendaController.handleGetRecurringEntries(req, res);

            expect(agendaModel.getRecurringAgendaEntries).toHaveBeenCalledTimes(1);
            expect(agendaModel.getRecurringAgendaEntries).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRecurring);
        });

         it('should return 400 if userId is invalid', async () => {
            req = mockRequest({ userId: 'bad' });

            await agendaController.handleGetRecurringEntries(req, res);

            expect(agendaModel.getRecurringAgendaEntries).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'User ID inválido.' });
         });

         it('should return 500 if model throws an error', async () => {
            req = mockRequest({ userId: String(userId) });
            agendaModel.getRecurringAgendaEntries.mockRejectedValue(new Error('DB error'));

            await agendaController.handleGetRecurringEntries(req, res);

            expect(agendaModel.getRecurringAgendaEntries).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener las entradas recurrentes.' });
            expect(console.error).toHaveBeenCalled();
         });
    });

   // --- Tests for handleGetPendingReminders ---
    describe('handleGetPendingReminders', () => {
        const userId = 30;
        const otherUserId = 31;
        const mockReminders = [{ id: 12, hora_inicio: '09:00:00' }];

        it('should return 200 and pending reminders if user is authorized', async () => {
            req = mockRequest({ userId: String(userId) }, {}, { id: userId });
            agendaModel.getPendingReminders.mockResolvedValue(mockReminders);

            await agendaController.handleGetPendingReminders(req, res);

            expect(agendaModel.getPendingReminders).toHaveBeenCalledTimes(1);
            expect(agendaModel.getPendingReminders).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockReminders);
        });

         it('should return 400 if userId is invalid', async () => {
            req = mockRequest({ userId: 'nope' }, {}, { id: userId }); 

            await agendaController.handleGetPendingReminders(req, res);

            expect(agendaModel.getPendingReminders).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'User ID inválido.' });
         });

         it('should return 403 if user is not authorized (userId mismatch)', async () => {
            req = mockRequest({ userId: String(otherUserId) }, {}, { id: userId });

            await agendaController.handleGetPendingReminders(req, res);

            expect(agendaModel.getPendingReminders).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'No autorizado para ver estos recordatorios.' });
         });

         it('should return 500 if model throws an error', async () => {
            req = mockRequest({ userId: String(userId) }, {}, { id: userId });
            agendaModel.getPendingReminders.mockRejectedValue(new Error('Reminder fetch failed'));

            await agendaController.handleGetPendingReminders(req, res);

            expect(agendaModel.getPendingReminders).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener los recordatorios pendientes.' });
            expect(console.error).toHaveBeenCalled();
         });
    });

   // --- Tests for handleUpdateLocation ---
    describe('handleUpdateLocation', () => {
        const agendaId = 77;
        const userId = 35;
        const locationData = { latitude: 40.7128, longitude: -74.0060 };
        const updatedEntryWithLoc = { id: agendaId, user_id: userId, ...locationData };

        it('should return 200 and the updated entry on success', async () => {
            req = mockRequest({ agendaId: String(agendaId) }, locationData, { id: userId });
            agendaModel.updateAgendaLocation.mockResolvedValue(updatedEntryWithLoc);

            await agendaController.handleUpdateLocation(req, res);

            expect(agendaModel.updateAgendaLocation).toHaveBeenCalledTimes(1);
            expect(agendaModel.updateAgendaLocation).toHaveBeenCalledWith(
                agendaId,
                userId,
                locationData.latitude,
                locationData.longitude
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedEntryWithLoc);
        });

        it('should return 400 if agendaId is invalid', async () => {
            req = mockRequest({ agendaId: 'xyz' }, locationData, { id: userId });

            await agendaController.handleUpdateLocation(req, res);

            expect(agendaModel.updateAgendaLocation).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Agenda ID inválido.' });
        });

        it('should return 400 if latitude is missing or invalid', async () => {
            const badData = { longitude: -74.0060 }; 
            req = mockRequest({ agendaId: String(agendaId) }, badData, { id: userId });

            await agendaController.handleUpdateLocation(req, res);

            expect(agendaModel.updateAgendaLocation).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Latitud y longitud deben ser números válidos.' });
        });

         it('should return 400 if longitude is missing or invalid', async () => {
            const badData = { latitude: 40.7128, longitude: 'not-a-number' }; 
            req = mockRequest({ agendaId: String(agendaId) }, badData, { id: userId });

            await agendaController.handleUpdateLocation(req, res);

            expect(agendaModel.updateAgendaLocation).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Latitud y longitud deben ser números válidos.' });
        });

         it('should return 404 if model throws "not found or user does not have permission"', async () => {
            req = mockRequest({ agendaId: String(agendaId) }, locationData, { id: userId });
            agendaModel.updateAgendaLocation.mockRejectedValue(new Error('Agenda entry not found or user does not have permission'));

            await agendaController.handleUpdateLocation(req, res);

            expect(agendaModel.updateAgendaLocation).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Entrada no encontrada o sin permiso para actualizar ubicación.' });
            expect(console.error).toHaveBeenCalled();
         });

         it('should return 500 if model throws a generic error', async () => {
            req = mockRequest({ agendaId: String(agendaId) }, locationData, { id: userId });
            agendaModel.updateAgendaLocation.mockRejectedValue(new Error('Generic location update error'));

            await agendaController.handleUpdateLocation(req, res);

            expect(agendaModel.updateAgendaLocation).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Error al actualizar la ubicación de la entrada.' });
            expect(console.error).toHaveBeenCalled();
         });
    });

}); 