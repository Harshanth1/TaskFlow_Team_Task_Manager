import { useState, useEffect } from 'react';
import Header from '../components/Layout/Header';
import teamService from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, UserPlus } from 'lucide-react';
import './Pages.css';

export default function TeamPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [teamSearch, setTeamSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => { fetchTeams(); }, []);

  useEffect(() => {
    setSelectedTeam((current) => {
      if (!teams.length) return null;
      if (!current) return teams[0];
      const updated = teams.find(team => team._id === current._id);
      return updated || teams[0];
    });
  }, [teams]);

  const fetchTeams = async () => {
    try {
      const res = await teamService.getAll();
      setTeams(res.data.data);
    } catch (error) { console.error('Error fetching teams:', error); }
    finally { setLoading(false); }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await teamService.create({ name: teamName });
      toast.success('Team created!');
      setShowTeamModal(false);
      setTeamName('');
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create team');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await teamService.addMember(selectedTeam._id, { email: memberEmail, role: memberRole });
      toast.success('Member added!');
      setShowMemberModal(false);
      setMemberEmail('');
      setMemberRole('member');
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (!confirm('Remove this member from the team?')) return;
    try {
      await teamService.removeMember(teamId, userId);
      toast.success('Member removed');
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove');
    }
  };

  const handleRoleChange = async (teamId, userId, newRole) => {
    try {
      await teamService.updateMemberRole(teamId, userId, newRole);
      toast.success('Role updated');
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);
  const normalizedTeamSearch = teamSearch.trim().toLowerCase();
  const filteredTeams = teams.filter(team =>
    team.name?.toLowerCase().includes(normalizedTeamSearch)
  );

  const selectedMembers = selectedTeam?.members || [];
  const normalizedMemberSearch = memberSearch.trim().toLowerCase();
  const filteredMembers = selectedMembers.filter((member) => {
    const name = member.user?.name || '';
    const email = member.user?.email || '';
    const matchesSearch = !normalizedMemberSearch
      || name.toLowerCase().includes(normalizedMemberSearch)
      || email.toLowerCase().includes(normalizedMemberSearch);
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = selectedMembers.filter(member => member.role === 'admin').length;
  const memberCount = Math.max(selectedMembers.length - adminCount, 0);
  const canManageSelectedTeam = user?.role === 'admin' && selectedTeam?.owner?._id === user?._id;

  return (
    <div className="fade-in">
      <Header title="Team Management">
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowTeamModal(true)}>
            <Plus size={16} /> New Team
          </button>
        )}
      </Header>

      {teams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>No teams yet</h3>
          <p>{user?.role === 'admin' ? 'Create a team to start collaborating.' : 'You haven\'t been added to any team yet.'}</p>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowTeamModal(true)}>Create Team</button>
          )}
        </div>
      ) : (
        <div className="team-management">
          <section className="surface team-panel">
            <div className="team-panel-header">
              <div>
                <h3>Teams</h3>
                <p className="text-secondary">Manage access and roles.</p>
              </div>
            </div>

            <div className="team-panel-stats">
              <div className="team-stat">
                <span className="team-stat-label">Teams</span>
                <span className="team-stat-value">{teams.length}</span>
              </div>
              <div className="team-stat">
                <span className="team-stat-label">Members</span>
                <span className="team-stat-value">{totalMembers}</span>
              </div>
            </div>

            <div className="team-search">
              <input type="text" className="input-field" placeholder="Search teams"
                value={teamSearch} onChange={e => setTeamSearch(e.target.value)} />
            </div>

            <div className="team-list-panel">
              {filteredTeams.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-6) var(--space-3)' }}>
                  <h3>No teams found</h3>
                </div>
              ) : (
                filteredTeams.map(team => (
                  <button key={team._id} type="button"
                    className={`team-list-item ${selectedTeam?._id === team._id ? 'active' : ''}`}
                    onClick={() => { setSelectedTeam(team); setMemberSearch(''); setRoleFilter('all'); }}>
                    <div className="team-list-left">
                      <div className="avatar avatar-sm">{team.name?.charAt(0).toUpperCase()}</div>
                      <div>
                        <span className="team-list-name">{team.name}</span>
                        <span className="team-list-meta">{team.members.length} members</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="surface team-detail">
            {selectedTeam ? (
              <>
                <div className="team-detail-header">
                  <div className="team-detail-title">
                    <span className="team-detail-kicker">Team</span>
                    <h2>{selectedTeam.name}</h2>
                    <div className="team-detail-meta">
                      <span className="meta-item">Owner: {selectedTeam.owner?.name || 'Unassigned'}</span>
                      <span className="meta-item">{selectedMembers.length} members</span>
                    </div>
                  </div>
                  {canManageSelectedTeam && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>
                      <UserPlus size={14} /> Add Member
                    </button>
                  )}
                </div>

                <div className="team-detail-bar">
                  <div className="team-bar-item">
                    <span className="team-bar-label">Admins</span>
                    <span className="team-bar-value">{adminCount}</span>
                  </div>
                  <div className="team-bar-item">
                    <span className="team-bar-label">Members</span>
                    <span className="team-bar-value">{memberCount}</span>
                  </div>
                  <div className="team-bar-item">
                    <span className="team-bar-label">Access</span>
                    <span className="team-bar-value">Controlled</span>
                  </div>
                </div>

                <div className="team-detail-controls">
                  <input type="text" className="input-field" placeholder="Search members"
                    value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
                  <select className="select-field" value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                </div>

                <div className="team-table">
                  <div className="team-table-header">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Role</span>
                    <span className="team-table-actions-header">Actions</span>
                  </div>
                  <div className="team-table-body">
                    {filteredMembers.length === 0 ? (
                      <div className="team-table-empty">No members match this view.</div>
                    ) : (
                      filteredMembers.map(member => {
                        const isOwner = member.user?._id === selectedTeam.owner?._id;
                        return (
                          <div key={member._id} className="team-table-row">
                            <div className="team-cell team-cell-name">
                              <div className="avatar avatar-sm">
                                {member.user?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="member-info">
                                <span className="member-name">{member.user?.name}</span>
                                <span className="member-email team-email-inline">{member.user?.email}</span>
                              </div>
                            </div>
                            <div className="team-cell team-cell-email">{member.user?.email}</div>
                            <div className="team-cell team-cell-role">
                              {canManageSelectedTeam ? (
                                <select className="select-field task-status-select"
                                  value={member.role}
                                  onChange={e => handleRoleChange(selectedTeam._id, member.user?._id, e.target.value)}>
                                  <option value="admin">Admin</option>
                                  <option value="member">Member</option>
                                </select>
                              ) : (
                                <span className={`badge badge-${member.role}`}>{member.role}</span>
                              )}
                              {isOwner && <span className="badge badge-primary">Owner</span>}
                            </div>
                            <div className="team-cell team-cell-actions">
                              {canManageSelectedTeam && !isOwner && (
                                <button className="btn btn-ghost btn-sm"
                                  onClick={() => handleRemoveMember(selectedTeam._id, member.user?._id)}>
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>Select a team</h3>
                <p>Pick a team from the left to manage access.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {showTeamModal && (
        <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Team</h2>
              <button className="modal-close" onClick={() => setShowTeamModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTeam} className="modal-form">
              <div className="input-group">
                <label>Team Name *</label>
                <input type="text" className="input-field" value={teamName}
                  onChange={e => setTeamName(e.target.value)} placeholder="Engineering Team" required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%'}}>Create Team</button>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Member to {selectedTeam?.name}</h2>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddMember} className="modal-form">
              <div className="input-group">
                <label>Member Email *</label>
                <input type="email" className="input-field" value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)} placeholder="member@example.com" required />
              </div>
              <div className="input-group">
                <label>Role</label>
                <select className="select-field" value={memberRole}
                  onChange={e => setMemberRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%'}}>Add Member</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
