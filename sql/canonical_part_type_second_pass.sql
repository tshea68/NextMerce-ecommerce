update parts
set canonical_part_type = case
  when lower(coalesce(specific_part_type,'')) in (
    'switch','pressure switch','infinite switch','limit switch','lid switch',
    'selector switch','temperature switch','interlock switch','microswitch',
    'reed switch','float switch','high limit switch','switch rocker',
    'water level switch','air pressure switch','cycle switch',
    'ignition switch','door switch','hood switch','pb switch',
    'switch pressure','switch tact'
  ) then 'Switch'

  when lower(coalesce(specific_part_type,'')) in (
    'pc board','electronic control','mainboard','main control',
    'board main control','machine board with frame','main power board',
    'power board','led board'
  ) then 'Control Board'

  when lower(coalesce(specific_part_type,'')) in (
    'harns wire','harns','cable','connector','cord power','terminal',
    'terminal block','connector terminal block','wire holder','jumper wire',
    'wire jumper','connector rail','connector wafer','wire tie','cord',
    'socket','receptacle'
  ) then 'Wire Harness'

  when lower(coalesce(specific_part_type,'')) in (
    'service data sheet','repair','service','sheet','drawing','card technical'
  ) then 'Guides, Diagrams & Instructions'

  when lower(coalesce(specific_part_type,'')) in (
    'spring','roller','wheel','bearing','belt','shaft','coupler','gearcase',
    'planetary','planetary gear','idler pulley','drive belt','v belt',
    'tri power belt','tri power bx belt','classic a sect belt',
    'classic b sect belt','ball bearing','bearing ball'
  ) then 'Mechanical / Drive Component'
  when lower(coalesce(specific_part_type,'')) in (
    'lid','cap','glass','plug','lens','insert','bezel','top','top plate',
    'glass plate','glass ceramic','glass frame','glass window','window glass',
    'ceramic glass','ceramic glass top','ceramic glass hob top',
    'glass ceramic hob top','maintop glass and frame','top glass'
  ) then 'Cover'

  when lower(coalesce(specific_part_type,'')) in (
    'support','supporter','holder','shield','rail','slide','slide rail',
    'rail holder','rail connector','mounting rail','pull out rail',
    'top rail','low slide rail','holder rail'
  ) then 'Bracket'

  when lower(coalesce(specific_part_type,'')) in (
    'power','limit','overload','overload protector','overload protect',
    'contactor','terminal block connector','terminal box','fuse holder',
    'fuse block','thermal fuse','thermo fuse','time delay fuse'
  ) then 'Electrical Component'

  else canonical_part_type
end
where availability_rank in (1,2)
  and canonical_part_type = 'Other';
