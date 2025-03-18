import User, { IUser, UserRole } from './user.model';
import Project, { IProject, ProjectStatus } from './project.model';
import File, { IFile } from './file.model';
import Comment, { IComment } from './comment.model';
import Cohort, { ICohort } from './cohort.model';
import Assignment, { IAssignment, AssignmentType } from './assignment.model';
import Notification, { INotification, NotificationType, ResourceType } from './notification.model';

export {
    User,
    IUser,
    UserRole,
    Project,
    IProject,
    ProjectStatus,
    File,
    IFile,
    Comment,
    IComment,
    Cohort,
    ICohort,
    Assignment,
    IAssignment,
    AssignmentType,
    Notification,
    INotification,
    NotificationType,
    ResourceType
};

export default {
    User,
    Project,
    File,
    Comment,
    Cohort,
    Assignment,
    Notification
}; 