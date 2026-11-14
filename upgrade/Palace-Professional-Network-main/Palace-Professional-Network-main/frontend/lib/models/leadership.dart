/// Palace Professional Network leadership, taken from the "Leadership
/// Structure" block on each group tab of the PPN dashboard spreadsheet
/// (Leads/Palace Professional Network _ Dashboard - New.xlsx). Bios come from
/// Leads/Biography-Leads.docx.
class Leader {
  final String name;
  final String role;

  /// As written in the spreadsheet; null when no number was given.
  final String? phone;
  final String? photoAsset;
  final String? bio;

  const Leader({
    required this.name,
    required this.role,
    this.phone,
    this.photoAsset,
    this.bio,
  });
}

class ProfessionalGroup {
  /// Matches the backend's profession category text closely enough for
  /// ProfessionImages.assetFor to pick the group's illustration.
  final String name;
  final Leader coordinator;
  final Leader secretary;
  final Leader principalMember;

  const ProfessionalGroup({
    required this.name,
    required this.coordinator,
    required this.secretary,
    required this.principalMember,
  });

  List<Leader> get leaders => [coordinator, secretary, principalMember];
}

class Leadership {
  Leadership._();

  static const coordinatorRole = 'Professional Coordinator';
  static const secretaryRole = 'Secretary';
  static const principalMemberRole = 'Principal Member';

  static const _photos = 'assets/images/leads';

  /// Head of the Professional Coordinators, who oversees all the groups.
  /// Also the Healthcare Professionals group's coordinator.
  static const Leader chiefCoordinator = Leader(
    name: 'Mrs. Regina R. Matey',
    role: 'Chief Professional Coordinator',
    phone: '0278060762',
    photoAsset: '$_photos/racheal.jpg',
    bio: _rachealBio,
  );

  static const _rachealBio =
      'Racheal is a dedicated healthcare professional and an advocate '
      'for maternal and child health, with specialized expertise in '
      'nursing, midwifery practice, and public health education. With a '
      'decade of hands-on experience in both small clinics and large, '
      'state-of-the-art health facilities, she brings a wealth of '
      'clinical knowledge and practical insight into maternal and '
      'reproductive health.\n\n'
      'In 2023, she was nominated as the Outstanding Midwife at the '
      'Greater Accra Regional Hospital and received the Best Practicing '
      'Midwife Award for the Greater Accra Region during the '
      'International Day of Midwives. In 2024, she was honoured again as '
      'the Outstanding Midwife for the Neonatal Resuscitation Team at '
      'Greater Accra Regional Hospital, Ridge.';

  static const List<ProfessionalGroup> groups = [
    ProfessionalGroup(
      name: 'Accountants and Financial Professionals',
      coordinator: Leader(
        name: 'Mr. Ernest Adu Owusu',
        role: coordinatorRole,
        phone: '0249065107',
        photoAsset: '$_photos/ernest.jpg',
        bio:
            'Ernest is a VP in charge of Strategy and Business Development, '
            'Global Markets at Black Star Group, a wholly owned Ghanaian '
            'Investment Banking firm.',
      ),
      secretary: Leader(
        name: 'Ms. Eyram Atsisey',
        role: secretaryRole,
        phone: '0543704453',
      ),
      principalMember: Leader(
        name: 'Ms. Bernadina Nti-Darko',
        role: principalMemberRole,
        phone: '0578751553',
      ),
    ),
    ProfessionalGroup(
      name: 'Engineers and Architects',
      coordinator: Leader(
        name: 'Mr. Ebenezer Akyeampong',
        role: coordinatorRole,
        phone: '0246868510',
        photoAsset: '$_photos/ebenezer.jpg',
        bio:
            'Ebenezer Asante Akyeampong is an experienced Automobile Engineer, '
            'Fleet and Transport Management Professional, Maintenance and '
            'Reliability Practitioner, Logistician, and Certified Trainer with '
            'over 25 years of professional experience in automobile '
            'engineering, fleet operations, transportation management, '
            'logistics, maintenance, reliability, road safety, and driver '
            'development. He is the Managing Director of ASKBEN Fleet & '
            'Maintenance Consultancy.\n\n'
            'Throughout his career, Ebenezer has worked with both local and '
            'multinational organizations, managing diverse vehicle fleets, '
            'transportation operations, workshops, maintenance programs, '
            'driver performance, fleet compliance, and logistics systems. His '
            'multidisciplinary background enables him to bridge the gap '
            'between vehicle engineering, fleet management, maintenance '
            'reliability, transport operations, logistics, and human '
            'performance.',
      ),
      secretary: Leader(
        name: 'Delali Mensah',
        role: secretaryRole,
        phone: '0201932345',
      ),
      principalMember: Leader(
        name: 'Mr. Kobby Woode',
        role: principalMemberRole,
        phone: '0244209330',
      ),
    ),
    ProfessionalGroup(
      name: 'Lawyers and Legal Professionals',
      coordinator: Leader(
        name: 'Ms. Evelyn Baffloe',
        role: coordinatorRole,
        phone: '0243065692',
        photoAsset: '$_photos/evelyn.jpg',
        bio:
            'Akweley is a Ghanaian-trained lawyer with nine years\' experience '
            'at the Bar and a proven track record in corporate and commercial '
            'practice. She is a Solicitor and Barrister of the Supreme Court '
            'of Ghana and an Associate at Fugar & Company, one of the leading '
            'law firms in the African region.\n\n'
            'As a member of the firm\'s Corporate and Commercial Desk, she '
            'advises clients on complex and commercially significant matters. '
            'Her experience spans real estate, property acquisition, and '
            'related legal transactions.\n\n'
            'Akweley holds a Barrister-at-Law Qualifying Certificate, a Master '
            'of Arts in Communications, a BSc in Business Administration '
            '(Management), a Bachelor of Laws (LL.B.), and a Diploma in '
            'Journalism. She is a member of the Ghana Bar Association, Ghana '
            'Journalists Association, and the Institute of Public Relations, '
            'Ghana.',
      ),
      secretary: Leader(
        name: 'Ms. Edinam Yaotse',
        role: secretaryRole,
        phone: '0549451546',
      ),
      principalMember: Leader(
        name: 'Mr. Benny Ato Sam',
        role: principalMemberRole,
        phone: '0245505814',
      ),
    ),
    ProfessionalGroup(
      name: 'Teachers and Educators',
      coordinator: Leader(
        name: 'Mr. Richard Adika',
        role: coordinatorRole,
        phone: '0552598991',
        photoAsset: '$_photos/richard.jpg',
        bio:
            'Richard is an Educator with a degree in Earth Science (University '
            'of Ghana) and a Postgraduate Diploma in Education. Currently '
            'teaching at Palace Royal International School, focused on '
            'developing learners\' potential through sound educational '
            'practice.',
      ),
      secretary: Leader(
        name: 'Mrs. Agnes Anang',
        role: secretaryRole,
        phone: '0555166228',
      ),
      principalMember: Leader(
        name: 'Mr. Joshua Newman',
        role: principalMemberRole,
        phone: '0543535060',
      ),
    ),
    ProfessionalGroup(
      name: 'Non-Governmental Organisation Professionals',
      coordinator: Leader(
        name: 'Mrs. Shirley Aseweh',
        role: coordinatorRole,
        phone: '0243553466',
        photoAsset: '$_photos/shirley.jpg',
        bio:
            'Shirley Aseweh is a dedicated and results-driven Procurement '
            'professional with experience in procurement coordination, '
            'supplier management, sourcing, contract administration, and '
            'compliance within the NGO sector. She is passionate about ethical '
            'and efficient procurement, cost savings, process improvement, and '
            'ensuring value for money.\n\n'
            'Shirley holds an MSc in Procurement Management and the MCIPS '
            'professional qualification. Beyond her professional life, she is '
            'a family-oriented woman and an entrepreneur building her '
            'business, Graceful Handpicked. She values integrity, excellence, '
            'faith, meaningful relationships, and continuous personal growth.',
      ),
      secretary: Leader(
        name: 'Mr. Isaac Nyampong',
        role: secretaryRole,
        phone: '0248307521',
      ),
      principalMember: Leader(
        name: 'Mrs. Hanna-Belle Nyampong',
        role: principalMemberRole,
        phone: '0243302006',
      ),
    ),
    ProfessionalGroup(
      name: 'ICT and Technology Professionals',
      coordinator: Leader(
        name: 'Mrs. Priscilla Adu',
        role: coordinatorRole,
        phone: '0200023500',
        photoAsset: '$_photos/priscilla.jpg',
        bio:
            'Priscilla is a purposeful Christian, IT & Business Systems '
            'professional, and ministry enthusiast passionate about serving '
            'God and impacting people. She is passionate about young adult '
            'ministry, worship, dance, leadership, discipleship, and community '
            'transformation.\n\n'
            'Professionally, she is passionate about technology, digital '
            'transformation, cloud computing, cybersecurity, and using '
            'innovative solutions to solve real-world problems. Her ultimate '
            'desire is to use her gifts, career, and ministry to empower '
            'others, inspire growth, and create meaningful impact.',
      ),
      secretary: Leader(name: 'Mr. Usi Peter', role: secretaryRole),
      principalMember: Leader(
        name: 'Mr. Edward Gyasi',
        role: principalMemberRole,
      ),
    ),
    ProfessionalGroup(
      name: 'Service Professionals',
      coordinator: Leader(
        name: 'Mr. Kamal Matey',
        role: coordinatorRole,
        phone: '0208000580',
        photoAsset: '$_photos/kamal.jpg',
        bio:
            'Kamal A. Matey is a seasoned police officer who has been with the '
            'Ghana Police Service for more than a decade. He has served as '
            'Aide to the Former Inspector General of Police of the Republic of '
            'Ghana, and with the National Election Security Task Force HQ, the '
            'Accra Regional Legal Department, the National Operational '
            'Department HQ, the Welfare Department HQ, the Research & '
            'Monitoring Department, the Information Communication Department '
            'and the Project Department.',
      ),
      secretary: Leader(name: 'Mrs. Gloria N. Abayateye', role: secretaryRole),
      principalMember: Leader(
        name: 'Mr. Elvis Sefa',
        role: principalMemberRole,
        phone: '0206906401',
      ),
    ),
    ProfessionalGroup(
      name: 'Healthcare Professionals',
      coordinator: Leader(
        name: 'Mrs. Regina R. Matey',
        role: coordinatorRole,
        phone: '0278060762',
        photoAsset: '$_photos/racheal.jpg',
        bio: _rachealBio,
      ),
      secretary: Leader(
        name: 'Miss Doreen O. Annang',
        role: secretaryRole,
        phone: '0554961198',
      ),
      principalMember: Leader(
        name: 'Mrs. Sharon Aseweh',
        role: principalMemberRole,
        phone: '0246838091',
      ),
    ),
    ProfessionalGroup(
      name: 'Media and Communication Professionals',
      coordinator: Leader(
        name: 'Mr. Kenneth Bray',
        role: coordinatorRole,
        phone: '0556521538',
        photoAsset: '$_photos/kenneth.jpg',
        bio:
            'Kenneth Bray is a Brand Communication and Digital Marketing '
            'professional with a keen interest in brand protection and the '
            'legal aspects of business and communication. As a Law student, '
            'he is passionate about understanding how law and strategic '
            'communication can work together to build, strengthen, and '
            'protect brands.\n\n'
            'His interests span brand strategy, brand protection, digital '
            'marketing, strategic communication and intellectual property.',
      ),
      secretary: Leader(
        name: 'Ms. Jessica Adjei',
        role: secretaryRole,
        phone: '057844778',
      ),
      principalMember: Leader(
        name: 'Mr. Aaron Eshun',
        role: principalMemberRole,
        phone: '0543299219',
      ),
    ),
    ProfessionalGroup(
      name: 'Administrative Professionals',
      coordinator: Leader(
        name: 'Mrs. Judith Sarfo',
        role: coordinatorRole,
        phone: '0246329166',
        photoAsset: '$_photos/judith.jpg',
        bio:
            'Judith is a dedicated and detail-oriented professional with '
            'extensive experience in administration, human resource '
            'management, and corporate governance. She currently serves as the '
            'Administrator and Acting Company Secretary at the Institute for '
            'Fiscal Studies (IFS), Ghana.\n\n'
            'She holds an MBA in Marketing and a BSc in Marketing from the '
            'University of Professional Studies, Accra (UPSA), as well as a '
            'Diploma in Communication Studies from the Ghana Institute of '
            'Journalism (GIJ), and has completed the Senior Professional in '
            'Human Resources International (SPHRi) course.',
      ),
      secretary: Leader(
        name: 'Ms. Christiana Borlu',
        role: secretaryRole,
        phone: '0504962042',
      ),
      principalMember: Leader(
        name: 'Mrs. Sabina Wereko',
        role: principalMemberRole,
        phone: '0505558873',
      ),
    ),
    ProfessionalGroup(
      name: 'Hospitality Professionals',
      coordinator: Leader(
        name: 'Mrs. Rhodaline Sackah Pappoe',
        role: coordinatorRole,
        phone: '0544915700',
        photoAsset: '$_photos/rhodaline.jpg',
        bio:
            'Rhodaline is a dedicated hospitality professional with over 20 '
            'years\' experience in the industry, having served as Restaurant '
            'Manager, Conference and Banquet Manager, Operations Manager, and '
            'Food and Beverage Manager. She is also a small business owner, '
            'running a Gift Shop specializing in cosmetics and distinctive '
            'gifts, and is recognised by the Intercontinental Hotel Groups '
            '(IHG).\n\n'
            'Rhodaline is a hardworking, client-centred and God-fearing woman '
            'who believes in service with humility and excellence.',
      ),
      secretary: Leader(
        name: 'Mrs. Sarah Michael',
        role: secretaryRole,
        phone: '026507046',
      ),
      principalMember: Leader(
        name: 'Mrs. Catherine Cofie',
        role: principalMemberRole,
        phone: '393249995538',
      ),
    ),
    ProfessionalGroup(
      name: 'Businessmen and Women (Artisans & Vendors)',
      coordinator: Leader(
        name: 'Ms. Ethel Adjei',
        role: coordinatorRole,
        phone: '0244182352',
        photoAsset: '$_photos/ethel.jpg',
        bio:
            'Lady Ethel is the CEO of Emblish Enterprise, an entrepreneur '
            '(Beads/Resin Art designer, importer and merchant trader), a '
            'trainer and a pre-school facilitator.\n\n'
            'She worked as a front desk personnel, sales personnel, '
            'administrative assistant, and P.A. to three CEOs for three '
            'companies in Ghana for 15 years, and volunteered with an NGO in '
            'its administrative sector while building her business. She is '
            'now managing her business full time, with over 400 members on '
            'her business platform.',
      ),
      secretary: Leader(name: 'Ms. Vanessa Yayra', role: secretaryRole),
      principalMember: Leader(
        name: 'Mrs. Mavis Blagogee',
        role: principalMemberRole,
        phone: '0543694433',
      ),
    ),
  ];
}
