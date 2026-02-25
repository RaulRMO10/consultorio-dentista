"""
Modelos SQLAlchemy para o banco de dados
"""
from sqlalchemy import Column, String, Boolean, DateTime, Date, Integer, Numeric, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid

from backend.services.database import Base


class Dentista(Base):
    """Modelo de Dentista"""
    __tablename__ = "dentistas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(200), nullable=False)
    cro = Column(String(50), nullable=False, unique=True)
    especialidade = Column(String(100))
    telefone = Column(String(20))
    email = Column(String(150))
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    agendamentos = relationship("Agendamento", back_populates="dentista")
    atendimentos = relationship("Atendimento", back_populates="dentista")


class Paciente(Base):
    """Modelo de Paciente"""
    __tablename__ = "pacientes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(200), nullable=False)
    cpf = Column(String(14), unique=True)
    data_nascimento = Column(Date)
    telefone = Column(String(20), nullable=False)
    celular = Column(String(20))
    email = Column(String(150))
    endereco = Column(Text)
    cidade = Column(String(100))
    estado = Column(String(2))
    cep = Column(String(10))
    observacoes = Column(Text)
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    agendamentos = relationship("Agendamento", back_populates="paciente")
    atendimentos = relationship("Atendimento", back_populates="paciente")
    historico = relationship("HistoricoOdontologico", back_populates="paciente")


class Procedimento(Base):
    """Modelo de Procedimento"""
    __tablename__ = "procedimentos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(200), nullable=False)
    descricao = Column(Text)
    valor_padrao = Column(Numeric(10, 2), nullable=False, default=0.00)
    duracao_minutos = Column(Integer, default=60)
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Agendamento(Base):
    """Modelo de Agendamento"""
    __tablename__ = "agendamentos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    paciente_id = Column(UUID(as_uuid=True), ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False)
    dentista_id = Column(UUID(as_uuid=True), ForeignKey("dentistas.id", ondelete="CASCADE"), nullable=False)
    data_hora = Column(DateTime, nullable=False)
    duracao_minutos = Column(Integer, default=60)
    status = Column(String(20), default="agendado")
    observacoes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('dentista_id', 'data_hora', name='uq_dentista_data_hora'),
    )
    
    # Relationships
    paciente = relationship("Paciente", back_populates="agendamentos")
    dentista = relationship("Dentista", back_populates="agendamentos")
    atendimento = relationship("Atendimento", back_populates="agendamento", uselist=False)


class Atendimento(Base):
    """Modelo de Atendimento"""
    __tablename__ = "atendimentos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agendamento_id = Column(UUID(as_uuid=True), ForeignKey("agendamentos.id", ondelete="CASCADE"), nullable=False)
    paciente_id = Column(UUID(as_uuid=True), ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False)
    dentista_id = Column(UUID(as_uuid=True), ForeignKey("dentistas.id", ondelete="CASCADE"), nullable=False)
    data_atendimento = Column(DateTime, nullable=False)
    anamnese = Column(Text)
    diagnostico = Column(Text)
    tratamento_realizado = Column(Text)
    observacoes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    agendamento = relationship("Agendamento", back_populates="atendimento")
    paciente = relationship("Paciente", back_populates="atendimentos")
    dentista = relationship("Dentista", back_populates="atendimentos")
    procedimentos = relationship("AtendimentoProcedimento", back_populates="atendimento")
    financeiro = relationship("Financeiro", back_populates="atendimento", uselist=False)


class AtendimentoProcedimento(Base):
    """Modelo de relação N:N entre Atendimento e Procedimento"""
    __tablename__ = "atendimentos_procedimentos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    atendimento_id = Column(UUID(as_uuid=True), ForeignKey("atendimentos.id", ondelete="CASCADE"), nullable=False)
    procedimento_id = Column(UUID(as_uuid=True), ForeignKey("procedimentos.id", ondelete="CASCADE"), nullable=False)
    quantidade = Column(Integer, default=1)
    valor_unitario = Column(Numeric(10, 2), nullable=False)
    dente = Column(String(10))
    observacoes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    atendimento = relationship("Atendimento", back_populates="procedimentos")


class Financeiro(Base):
    """Modelo de Financeiro"""
    __tablename__ = "financeiro"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    atendimento_id = Column(UUID(as_uuid=True), ForeignKey("atendimentos.id", ondelete="CASCADE"), nullable=False)
    valor_total = Column(Numeric(10, 2), nullable=False)
    valor_pago = Column(Numeric(10, 2), default=0.00)
    forma_pagamento = Column(String(50))
    status_pagamento = Column(String(20), default="pendente")
    data_vencimento = Column(Date)
    data_pagamento = Column(DateTime)
    observacoes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    atendimento = relationship("Atendimento", back_populates="financeiro")


class HistoricoOdontologico(Base):
    """Modelo de Histórico Odontológico"""
    __tablename__ = "historico_odontologico"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    paciente_id = Column(UUID(as_uuid=True), ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False)
    atendimento_id = Column(UUID(as_uuid=True), ForeignKey("atendimentos.id", ondelete="SET NULL"))
    data = Column(DateTime, nullable=False, default=func.now())
    dente = Column(String(10))
    procedimento = Column(String(200))
    descricao = Column(Text, nullable=False)
    dentista_id = Column(UUID(as_uuid=True), ForeignKey("dentistas.id", ondelete="SET NULL"))
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    paciente = relationship("Paciente", back_populates="historico")
