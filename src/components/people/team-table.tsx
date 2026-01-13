import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Mail, Pencil, Phone } from "lucide-react";

type MemberStatus = "ativo" | "ferias" | "afastado";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: MemberStatus;
  specialties: string[];
  avatar: string;
}

// Mock data - Equipe
const team: TeamMember[] = [
  {
    id: "1",
    name: "João Silva",
    role: "Técnico de Manutenção",
    department: "Mecânica",
    email: "joao.silva@inova.com",
    phone: "(11) 98765-4321",
    status: "ativo",
    specialties: ["Lubrificação", "Hidráulica"],
    avatar: "JS",
  },
  {
    id: "2",
    name: "Maria Santos",
    role: "Analista Preditiva",
    department: "Preditiva",
    email: "maria.santos@inova.com",
    phone: "(11) 98765-4322",
    status: "ativo",
    specialties: ["Vibração", "Termografia"],
    avatar: "MS",
  },
  {
    id: "3",
    name: "Carlos Pereira",
    role: "Técnico Mecânico",
    department: "Mecânica",
    email: "carlos.pereira@inova.com",
    phone: "(11) 98765-4323",
    status: "ativo",
    specialties: ["Soldagem", "Mecânica Geral"],
    avatar: "CP",
  },
  {
    id: "4",
    name: "Ana Costa",
    role: "Coordenadora de Planejamento",
    department: "Planejamento",
    email: "ana.costa@inova.com",
    phone: "(11) 98765-4324",
    status: "ativo",
    specialties: ["Gestão", "PCM"],
    avatar: "AC",
  },
  {
    id: "5",
    name: "Pedro Oliveira",
    role: "Técnico Eletricista",
    department: "Elétrica",
    email: "pedro.oliveira@inova.com",
    phone: "(11) 98765-4325",
    status: "ferias",
    specialties: ["Elétrica Industrial"],
    avatar: "PO",
  },
];

const statusMap = {
  ativo: { label: "Ativo", variant: "success" as const },
  ferias: { label: "Férias", variant: "warning" as const },
  afastado: { label: "Afastado", variant: "destructive" as const },
};

export function TeamTable() {
  return (
    <div className="rounded-lg border border-slate-100 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-100 hover:bg-transparent">
            <TableHead>Membro</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Especialidades</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.map((member) => (
            <TableRow
              key={member.id}
              className="border-slate-100 hover:bg-slate-50/50"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.role}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-slate-500">
                {member.department}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {member.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{member.phone}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusMap[member.status].variant}>
                  {statusMap[member.status].label}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button className="group rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="group rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
