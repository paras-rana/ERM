import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import AppFrame from '../components/AppFrame';
import Icon from '../components/Icon';
import { apiFetch } from '../lib/api';

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'ADMIN',
};

function getErrorMessage(err) {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

function formatRole(role) {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'SUPER_USER') return 'Super User';
  return role || '-';
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

export default function UserManagementPage() {
  const { token, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  async function loadUsers() {
    try {
      setLoading(true);
      setError('');

      const res = await apiFetch('/auth/users', { token, onUnauthorized: logout });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

      setUsers(data.users ?? []);
    } catch (err) {
      setError(`Failed to load users: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  function onFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError('');

      const res = await apiFetch('/auth/users', {
        method: 'POST',
        token,
        headers: {
          'Content-Type': 'application/json',
        },
        onUnauthorized: logout,
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

      setUsers((current) => [data.user, ...current]);
      setForm(initialForm);
    } catch (err) {
      setFormError(`Failed to create user: ${getErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppFrame
      title="User Management"
      description="Create users and assign access roles."
    >
      <section className="panel user-management-panel">
        <div className="user-management-grid">
          <form className="user-create-form" onSubmit={onSubmit}>
            <h2>Create User</h2>
            {formError ? <p className="error">{formError}</p> : null}

            <div className="form-grid">
              <label>
                Full Name
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={onFormChange}
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onFormChange}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onFormChange}
                  autoComplete="new-password"
                  required
                />
              </label>

              <label>
                Role
                <select name="role" value={form.role} onChange={onFormChange}>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_USER">Super User</option>
                </select>
              </label>
            </div>

            <button type="submit" className="primary-btn" disabled={saving}>
              <Icon name="plus" />
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </form>

          <div className="user-role-notes">
            <h2>Roles</h2>
            <p><strong>Admin</strong> has full access, including user management.</p>
            <p><strong>Super User</strong> has full access except user management.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h2>Existing Users</h2>
          <span className="muted">{users.length} user{users.length === 1 ? '' : 's'}</span>
        </div>

        {loading ? <p>Loading users...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {!loading && !error ? (
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.full_name || '-'}</td>
                    <td>{user.email}</td>
                    <td>{formatRole(user.role)}</td>
                    <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                    <td>{formatDate(user.created_at)}</td>
                  </tr>
                ))}

                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">No users found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </AppFrame>
  );
}
