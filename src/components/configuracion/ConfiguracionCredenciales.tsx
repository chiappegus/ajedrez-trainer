/**
 * Componente de configuración de credenciales
 * Feature: lichess-game-analysis
 * Valida: Requisitos 0.1.2, 0.1.3, 0.1.4, 0.1.5, 0.1.6, 0.1.7, 0.3.1, 0.3.2, 0.3.3, 0.4.1, 0.4.2
 */

import { useState } from 'react';
import { GestorCredenciales } from '../../services/credenciales/GestorCredenciales';
import { ClienteLichess } from '../../services/lichess/ClienteLichess';
import type { Credenciales } from '../../types/credenciales';
import './ConfiguracionCredenciales.css';

interface ConfiguracionCredencialesProps {
  /** Callback llamado cuando las credenciales se guardan exitosamente */
  onGuardadoExitoso?: () => void;
}

/**
 * Componente que proporciona un formulario para configurar las credenciales
 * de Lichess y Groq API
 */
export function ConfiguracionCredenciales({ onGuardadoExitoso }: ConfiguracionCredencialesProps) {
  const gestorCredenciales = new GestorCredenciales();

  // Estado del formulario
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [tokenLichess, setTokenLichess] = useState('');
  const [apiKeyGroq, setApiKeyGroq] = useState('');

  // Estado de UI
  const [validando, setValidando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar mensajes previos
    setMensajeExito('');
    setMensajeError('');
    setValidando(true);

    try {
      // Crear objeto de credenciales
      const credenciales: Credenciales = {
        nombreUsuario: nombreUsuario.trim(),
        username: nombreUsuario.trim(), // Mismo valor para compatibilidad
        tokenLichess: tokenLichess.trim(),
        apiKeyGroq: apiKeyGroq.trim()
      };

      // Validar credenciales
      const resultadoValidación = gestorCredenciales.validarCredenciales(credenciales);
      
      if (!resultadoValidación.válido) {
        setMensajeError(resultadoValidación.error || 'Error de validación');
        setValidando(false);
        return;
      }

      // Validar token de Lichess con la API
      const clienteLichess = new ClienteLichess(credenciales.tokenLichess, credenciales.nombreUsuario);
      
      const tokenEsValido = await clienteLichess.validarToken();
      
      if (!tokenEsValido) {
        setMensajeError('El token de Lichess es inválido o ha expirado. Por favor verifica que lo hayas copiado correctamente.');
        setValidando(false);
        return;
      }

      // Validar API key de Groq con una petición mínima
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${credenciales.apiKeyGroq}`,
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!groqResponse.ok) {
          if (groqResponse.status === 401) {
            setMensajeError('La API Key de Groq es inválida. Verifica que la hayas copiado correctamente.');
          } else {
            setMensajeError(`Error validando Groq API: ${groqResponse.status}`);
          }
          setValidando(false);
          return;
        }
      } catch (groqError) {
        if (groqError instanceof Error && groqError.name === 'TimeoutError') {
          setMensajeError('La validación de Groq tardó demasiado. Verifica tu conexión.');
        } else {
          setMensajeError('No se pudo conectar con Groq. Verifica tu conexión a internet.');
        }
        setValidando(false);
        return;
      }

      // Guardar credenciales
      gestorCredenciales.guardarCredenciales(credenciales);
      
      // Mostrar mensaje de éxito
      setMensajeExito('Tokens de Lichess y Groq validados correctamente. Credenciales guardadas.');
      
      // Llamar al callback si existe
      if (onGuardadoExitoso) {
        setTimeout(() => {
          onGuardadoExitoso();
        }, 1500);
      }
    } catch (error) {
      if (error instanceof Error) {
        // Manejar errores específicos de la validación del token
        if (error.message.includes('conexión') || error.message.includes('red')) {
          setMensajeError('No se pudo conectar con Lichess. Verifica tu conexión a internet e intenta de nuevo.');
        } else if (error.message.includes('validación del token tardó')) {
          setMensajeError('La validación del token tardó demasiado. Verifica tu conexión e intenta de nuevo.');
        } else {
          setMensajeError(error.message);
        }
      } else {
        setMensajeError('Error inesperado al validar las credenciales');
      }
    } finally {
      setValidando(false);
    }
  };

  /**
   * Maneja la limpieza de credenciales
   */
  const handleLimpiar = () => {
    if (confirm('¿Estás seguro de que deseas eliminar todas las credenciales almacenadas?')) {
      gestorCredenciales.limpiarCredenciales();
      setNombreUsuario('');
      setTokenLichess('');
      setApiKeyGroq('');
      setMensajeExito('Credenciales eliminadas exitosamente');
      setMensajeError('');
    }
  };

  return (
    <div className="configuracion-credenciales">
      <div className="configuracion-header">
        <h2>Configuración de Credenciales</h2>
        <p className="configuracion-descripcion">
          Configura tus credenciales de Lichess y Groq para acceder a tus partidas y generar análisis con IA.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="configuracion-form">
        {/* Campo: Nombre de usuario de Lichess */}
        <div className="form-group">
          <label htmlFor="nombreUsuario">
            Nombre de usuario de Lichess
          </label>
          <input
            id="nombreUsuario"
            type="text"
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            placeholder="ej: tunombredeusuario"
            disabled={validando}
            required
          />
        </div>

        {/* Campo: Token de Lichess */}
        <div className="form-group">
          <label htmlFor="tokenLichess">
            Token de API Personal de Lichess
          </label>
          <input
            id="tokenLichess"
            type="password"
            value={tokenLichess}
            onChange={(e) => setTokenLichess(e.target.value)}
            placeholder="lip_xxxxxxxxxxxx"
            disabled={validando}
            required
          />
          <p className="form-help">
            El token debe empezar con "lip_".{' '}
            <a
              href="https://lichess.org/account/oauth/token"
              target="_blank"
              rel="noopener noreferrer"
              className="form-link"
            >
              Generar token en Lichess
            </a>
          </p>
        </div>

        {/* Campo: API Key de Groq */}
        <div className="form-group">
          <label htmlFor="apiKeyGroq">
            API Key de Groq
          </label>
          <input
            id="apiKeyGroq"
            type="password"
            value={apiKeyGroq}
            onChange={(e) => setApiKeyGroq(e.target.value)}
            placeholder="gsk_xxxxxxxxxxxx"
            disabled={validando}
            required
          />
          <p className="form-help">
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="form-link"
            >
              Generar API Key en Groq
            </a>
          </p>
        </div>

        {/* Mensajes de feedback */}
        {mensajeError && (
          <div className="mensaje-error" role="alert">
            {mensajeError}
          </div>
        )}

        {mensajeExito && (
          <div className="mensaje-exito" role="status">
            {mensajeExito}
          </div>
        )}

        {/* Botones de acción */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={validando}
          >
            {validando ? 'Validando tokens...' : 'Guardar credenciales'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleLimpiar}
            disabled={validando}
          >
            Limpiar credenciales
          </button>
        </div>
      </form>
    </div>
  );
}
