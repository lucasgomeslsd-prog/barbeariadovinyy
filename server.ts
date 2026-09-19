import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/database';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // ROTAS DA API - BANCO DE DADOS PERSISTENTE
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Obter o estado completo do banco de dados (Sincronização)
  app.get('/api/database', (req, res) => {
    const schema = db.getSchema();
    // Omite senhas/salts sensíveis ao enviar para o cliente
    const safeSchema = {
      ...schema,
      admins: schema.admins.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        username: a.username,
        status: a.status,
      })),
    };
    res.json(safeSchema);
  });

  // ==========================================
  // AUTENTICAÇÃO E SEGURANÇA ADMIN
  // ==========================================
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios' });
    }

    const result = db.verifyAdminLogin(username, password);
    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.json({
      success: true,
      user: {
        id: result.admin?.id,
        name: result.admin?.name,
        username: result.admin?.username,
      },
    });
  });

  // Alterar Senha do ADMIN (Validada e salva com hash PBKDF2 no Banco de Dados)
  app.post('/api/admin/change-password', (req, res) => {
    const { username = 'admin', currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Preencha todos os campos obrigatórios para alterar a senha.' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'A nova senha e a confirmação não conferem.' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'A nova senha deve possuir no mínimo 6 caracteres.' 
      });
    }

    const result = db.changeAdminPassword(username, currentPassword, newPassword);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  });

  // ==========================================
  // AGENDAMENTOS
  // ==========================================
  app.get('/api/appointments', (req, res) => {
    res.json(db.getAppointments());
  });

  app.post('/api/appointments', (req, res) => {
    const result = db.createAppointment(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(201).json(result);
  });

  app.put('/api/appointments/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    const updated = db.updateAppointmentStatus(id, status, paymentStatus);
    if (!updated) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    return res.json(updated);
  });

  app.put('/api/appointments/:id/reschedule', (req, res) => {
    const { id } = req.params;
    const { date, time } = req.body;
    const updated = db.rescheduleAppointment(id, date, time);
    if (!updated) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    return res.json(updated);
  });

  app.post('/api/appointments/:id/cancel', (req, res) => {
    const { id } = req.params;
    const { reason, cancelledBy } = req.body;
    const updated = db.cancelAppointment(id, reason, cancelledBy);
    if (!updated) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    return res.json(updated);
  });

  app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const deleted = db.deleteAppointment(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    return res.json({ success: true, message: 'Agendamento excluído com sucesso' });
  });

  // ==========================================
  // SERVIÇOS & TAXA DE AGENDAMENTO
  // ==========================================
  app.get('/api/services', (req, res) => {
    res.json(db.getServices());
  });

  app.put('/api/services', (req, res) => {
    const saved = db.saveServices(req.body);
    res.json(saved);
  });

  app.post('/api/services', (req, res) => {
    const saved = db.saveService(req.body);
    res.json(saved);
  });

  app.delete('/api/services/:id', (req, res) => {
    const { id } = req.params;
    const ok = db.deleteService(id);
    res.json({ success: ok });
  });

  // ==========================================
  // PROFISSIONAIS & DISPONIBILIDADE INDIVIDUAL
  // ==========================================
  app.get('/api/professionals', (req, res) => {
    res.json(db.getProfessionals());
  });

  app.put('/api/professionals', (req, res) => {
    const saved = db.saveProfessionals(req.body);
    res.json(saved);
  });

  app.put('/api/professionals/:id', (req, res) => {
    const saved = db.updateProfessional(req.body);
    res.json(saved);
  });

  app.delete('/api/professionals/:id', (req, res) => {
    const { id } = req.params;
    const ok = db.deleteProfessional(id);
    res.json({ success: ok });
  });

  // ==========================================
  // CONFIGURAÇÕES DA BARBEARIA & PIX
  // ==========================================
  app.get('/api/config', (req, res) => {
    res.json(db.getConfig());
  });

  app.put('/api/config', (req, res) => {
    const saved = db.saveConfig(req.body);
    res.json(saved);
  });

  // ==========================================
  // HORÁRIOS BLOQUEADOS MANUALMENTE
  // ==========================================
  app.get('/api/blocked-slots', (req, res) => {
    res.json(db.getBlockedSlots());
  });

  app.post('/api/blocked-slots', (req, res) => {
    const added = db.addBlockedSlot(req.body);
    res.status(201).json(added);
  });

  app.delete('/api/blocked-slots/:id', (req, res) => {
    const { id } = req.params;
    db.removeBlockedSlot(id);
    res.json({ success: true });
  });

  // ==========================================
  // NOTIFICAÇÕES ADMIN
  // ==========================================
  app.get('/api/notifications', (req, res) => {
    res.json(db.getNotifications());
  });

  app.post('/api/notifications/read-all', (req, res) => {
    db.markAllNotificationsRead();
    res.json({ success: true });
  });

  // ==========================================
  // CLIENTES
  // ==========================================
  app.get('/api/clients', (req, res) => {
    res.json(db.getClients());
  });

  app.put('/api/clients/:id', (req, res) => {
    const updated = db.updateClient(req.body);
    res.json(updated);
  });

  app.patch('/api/clients/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (status !== 'ativo' && status !== 'inativo') {
      return res.status(400).json({ error: 'Status deve ser ativo ou inativo' });
    }
    const updated = db.setClientStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(updated);
  });

  app.delete('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    const deleted = db.deleteClient(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json({ success: true, message: 'Cliente excluído com sucesso' });
  });

  // ==========================================
  // SERVIR APLICAÇÃO CLIENTE COM VITE
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Barbearia App] Servidor operacional na porta ${PORT}`);
  });
}

startServer();
