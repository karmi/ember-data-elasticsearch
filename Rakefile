%w| ansi/core popen4 |.each do |lib|
  begin
    require lib
  rescue LoadError => e
    gem_name = lib.split('/').first
    puts "[!] Required Rubygem '#{gem_name}' not found, install with:",
         "    gem install #{gem_name}", ""
    exit(1)
  end
end

desc "Run tests with phantomjs"
task :test do |t, args|
  unless system("which phantomjs > /dev/null 2>&1")
    puts ANSI.red("[!] PhantomJS is not installed, aborting... See <http://phantomjs.org>")
    exit(1)
  end

  system "curl -s -X DELETE 'http://localhost:9200/people-test' > /dev/null"

  cmd = "phantomjs tests/run-qunit.js '#{File.dirname(__FILE__)}/tests/index.html'"
  # puts cmd

  result = ''

  status = POpen4::popen4(cmd) do |stdout, stderr, stdin, pid|
    while line = stdout.gets
      if line =~ /Time:/
        result = line.chomp
      else
        puts line
      end
    end
  end

  color = status.success? ? :green : :red
  puts ['='*80, result, '-'*80].join("\n").ansi( color )
  exit(status.exitstatus)
end
